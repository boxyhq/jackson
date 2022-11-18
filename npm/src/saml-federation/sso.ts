import saml from '@boxyhq/saml20';
import crypto from 'crypto';

import type { JacksonOption, SAMLConnection, SAMLSSORecord, Storable } from '../typings';
import type { SAMLFederationApp } from './app';
import {
  createSAMLResponse,
  signSAMLResponse,
  extractSAMLRequestAttributes,
  extractSAMLResponseAttributes,
} from './utils';
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

  // Get the authorize URL that will be used to redirect the user to the Identity Provider
  public getAuthorizeUrl = async ({ request, relayState }: { request: string; relayState: string }) => {
    const { id, acsUrl, entityId, publicKey, providerName } = await extractSAMLRequestAttributes(request);

    const app = await this.app.getByEntityId(entityId);

    if (app.acsUrl !== acsUrl) {
      throw new JacksonError("Assertion Consumer Service URL doesn't match.", 400);
    }

    const sessionId = crypto.randomBytes(16).toString('hex');

    // Create a new session to store SP request information
    await this.session.put(sessionId, {
      id: sessionId,
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

    const { redirectUrl } = await this.createSAMLRequest({
      tenant: app.tenant,
      product: app.product,
      relayState: `${relayStatePrefix}${sessionId}`,
    });

    return {
      redirectUrl,
    };
  };

  // Create a SAML Request to be sent to Identity Provider
  public createSAMLRequest = async ({
    tenant,
    product,
    relayState,
    idp,
  }: {
    tenant: string;
    product: string;
    relayState: string;
    idp?: string;
  }) => {
    const certificate = await getDefaultCertificate();

    await this._getSession(relayState);

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
    if (idp) {
      connection = connections.find((c) => c.clientID === idp);

      if (!connection) {
        throw new JacksonError('No SAML connection found.', 404);
      }
    }

    // If more than one, redirect to the connection selection page
    if (!connection && connections.length > 1) {
      return {
        redirectUrl: `${this.opts.externalUrl}/idp/choose-connection?tenant=${tenant}&product=${product}&relayState=${relayState}`,
      };
    }

    // If only one, use that connection
    if (!connection) {
      connection = connections[0];
    }

    const samlRequest = saml.request({
      ssoUrl: connection.idpMetadata.sso.redirectUrl,
      entityID: `${this.opts.samlAudience}`,
      callbackUrl: `${this.opts.externalUrl}/api/oauth/saml`,
      signingKey: certificate.privateKey,
      publicKey: certificate.publicKey,
    });

    // Create URL to redirect to the Identity Provider
    const url = new URL(`${connection.idpMetadata.sso.redirectUrl}`);

    url.searchParams.set('RelayState', relayState);
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

      const xmlSigned = await createSAMLResponse({
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
          value: Buffer.from(xmlSigned).toString('base64'),
        },
      ]);

      // Remove the session after we've created the SAML Response
      await this.session.delete(sessionId);

      return { htmlForm };
    } catch (err) {
      throw new JacksonError('Unable to validate SAML Response.', 403);
    }
  };

  // Get the SAML connections for the given tenant and product
  public getConnections = async ({
    tenant,
    product,
    relayState,
  }: {
    tenant: string;
    product: string;
    relayState: string;
  }) => {
    const session = await this._getSession(relayState);

    // Make sure user has access to the app
    if (tenant !== session.app.tenant || product !== session.app.product) {
      throw new JacksonError('Invalid RelayState', 400);
    }

    const connections: SAMLSSORecord[] = await this.connection.getByIndex({
      name: IndexNames.TenantProduct,
      value: dbutils.keyFromParts(tenant, product),
    });

    if (!connections || connections.length === 0) {
      throw new JacksonError('No SAML connection found.', 404);
    }

    return connections;
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
