import saml from '@boxyhq/saml20';
import crypto from 'crypto';

import type { SAMLFederationApp } from './app';
import type { JacksonOption, SAMLConnection, SAMLSSORecord, Storable } from '../typings';
import { createSAMLResponse, extractSAMLRequestAttributes, extractSAMLResponseAttributes } from './utils';
import { App } from './app';
import { promisify } from 'util';
import { deflateRaw } from 'zlib';
import * as dbutils from '../db/utils';
import { IndexNames } from '../controller/utils';
import { JacksonError } from '../controller/error';
import { getDefaultCertificate } from '../saml/x509';

const deflateRawAsync = promisify(deflateRaw);

// Used to identify the relay state as a federated SAML request
const relayStatePrefix = 'federated_saml_';

export class SSOHandler {
  private app: App;
  private session: Storable;
  private connection: Storable;
  private opts: JacksonOption;

  constructor({
    app,
    session,
    connection,
    opts,
  }: {
    app: App;
    session: Storable;
    connection: Storable;
    opts: JacksonOption;
  }) {
    this.app = app;
    this.session = session;
    this.connection = connection;
    this.opts = opts;
  }

  // Accept the SAML Request from Service Provider, and create a new SAML Request to be sent to Identity Provider
  public getAuthorizeUrl = async ({
    request,
    relayState,
    idp_hint,
  }: {
    request: string;
    relayState: string;
    idp_hint?: string;
  }) => {
    const { id, acsUrl, entityId, publicKey, providerName } = await extractSAMLRequestAttributes(request);

    // Verify the request if it is signed
    if (publicKey && !saml.hasValidSignature(request, publicKey, null)) {
      throw new JacksonError('Invalid SAML Request signature.', 400);
    }

    const app = await this.app.getByEntityId(entityId);

    if (app.acsUrl !== acsUrl) {
      throw new JacksonError("Assertion Consumer Service URL doesn't match.", 400);
    }

    const { tenant, product } = app;

    // Find SAML connections for the app
    const connections: SAMLSSORecord[] = await this.connection.getByIndex({
      name: IndexNames.TenantProduct,
      value: dbutils.keyFromParts(tenant, product),
    });

    if (!connections || connections.length === 0) {
      throw new JacksonError('No SAML connection found.', 404);
    }

    let connection: SAMLSSORecord | undefined;

    // If an IdP is specified, find the connection for that IdP
    if (idp_hint) {
      connection = connections.find((c) => c.clientID === idp_hint);

      if (!connection) {
        throw new JacksonError('No SAML connection found.', 404);
      }
    }

    // If more than one, redirect to the connection selection page
    if (!connection && connections.length > 1) {
      const url = new URL(`${this.opts.externalUrl}${this.opts.idpDiscoveryPath}`);

      const params = new URLSearchParams({
        tenant,
        product,
        RelayState: relayState,
        SAMLRequest: request,
        authFlow: 'saml-federation',
      });

      url.search = params.toString();

      return {
        redirectUrl: url.toString(),
      };
    }

    // If only one, use that connection
    if (!connection) {
      connection = connections[0];
    }

    // We have a connection now, so we can create the SAML request
    const certificate = await getDefaultCertificate();

    const sessionId = crypto.randomBytes(16).toString('hex');

    const samlRequest = saml.request({
      ssoUrl: connection.idpMetadata.sso.redirectUrl,
      entityID: `${this.opts.samlAudience}`,
      callbackUrl: `${this.opts.externalUrl}/api/oauth/saml`,
      signingKey: certificate.privateKey,
      publicKey: certificate.publicKey,
    });

    // Create a new session to store SP request information
    await this.session.put(sessionId, {
      id: samlRequest.id,
      app,
      request: {
        id,
        acsUrl,
        entityId,
        publicKey,
        providerName,
        relayState,
      },
    });

    // Create URL to redirect to the Identity Provider
    const url = new URL(`${connection.idpMetadata.sso.redirectUrl}`);

    url.searchParams.set('RelayState', `${relayStatePrefix}${sessionId}`);
    url.searchParams.set(
      'SAMLRequest',
      Buffer.from(await deflateRawAsync(samlRequest.request)).toString('base64')
    );

    return {
      redirectUrl: url.toString(),
    };
  };

  // Handle the SAML Response coming from an Identity Provider and create a new SAML Response to be sent back to the Service Provider
  public generateSAMLResponse = async ({
    response,
    relayState,
  }: {
    response: string;
    relayState: string;
  }) => {
    const { id: sessionId, request } = await this._getSession(relayState);

    const entityId = saml.parseIssuer(Buffer.from(response, 'base64').toString());

    if (!entityId) {
      throw new JacksonError("Missing 'Entity ID' in SAML Response.", 400);
    }

    // Find SAML connections for the app
    const connections: SAMLConnection[] = await this.connection.getByIndex({
      name: IndexNames.EntityID,
      value: entityId,
    });

    if (!connections || connections.length === 0) {
      throw new JacksonError('No SAML connection found.', 404);
    }

    const connection = connections[0];

    const certificate = await getDefaultCertificate();

    try {
      // Extract SAML Response attributes sent by the IdP
      const attributes = await extractSAMLResponseAttributes(response, {
        thumbprint: connection.idpMetadata.thumbprint,
        audience: `${this.opts.samlAudience}`,
        privateKey: certificate.privateKey,
      });

      const responseSigned = await createSAMLResponse({
        audience: request.entityId,
        acsUrl: request.acsUrl,
        issuer: `${this.opts.samlAudience}`,
        requestId: request.id,
        profile: {
          ...attributes,
        },
        ...certificate,
      });

      const htmlForm = saml.createPostForm(request.acsUrl, [
        {
          name: 'RelayState',
          value: request.relayState,
        },
        {
          name: 'SAMLResponse',
          value: Buffer.from(responseSigned).toString('base64'),
        },
      ]);

      // Remove the session after we've created the SAML Response
      await this.session.delete(sessionId);

      return { htmlForm };
    } catch (err) {
      throw new JacksonError('Unable to validate SAML Response.', 403);
    }
  };

  _getSession = async (relayState: string) => {
    const sessionId = relayState.replace(relayStatePrefix, '');

    const session: SPRequestSession = await this.session.get(sessionId);

    if (!session) {
      throw new JacksonError('Unable to validate state from the origin request.', 404);
    }

    return session;
  };
}

type SPRequestSession = {
  id: string;
  app: SAMLFederationApp;
  request: {
    id: string;
    acsUrl: string;
    entityId: string;
    publicKey: string | null;
    providerName: string;
    relayState: string;
  };
};
