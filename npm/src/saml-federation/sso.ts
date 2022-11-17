import saml from '@boxyhq/saml20';
import type { SAMLProfile } from '@boxyhq/saml20/dist/typings';

import type { JacksonOption, SAMLConnection, Storable } from '../typings';
import type { SAMLFederationApp } from './app';
import {
  decodeBase64,
  extractSAMLRequestAttributes,
  extractSAMLResponseAttributes,
  createSAMLResponse,
  signSAMLResponse,
} from './utils';
import { App } from './app';
import { promisify } from 'util';
import { deflateRaw } from 'zlib';
import * as dbutils from '../db/utils';
import { IndexNames } from '../controller/utils';
import { JacksonError } from '../controller/error';
import { getDefaultCertificate } from '../saml/x509';

const deflateRawAsync = promisify(deflateRaw);

export class SSOHandler {
  private app: App;
  private session: Storable;
  private connection: Storable;
  private opts: JacksonOption;

  constructor({
    app,
    sessionStore,
    connectionStore,
    opts,
  }: {
    app: App;
    sessionStore: Storable;
    connectionStore: Storable;
    opts: JacksonOption;
  }) {
    this.app = app;
    this.session = sessionStore;
    this.connection = connectionStore;
    this.opts = opts;
  }

  // Get the authorize URL that will be used to redirect the user to the Identity Provider
  public getAuthorizeUrl = async ({ request, relayState }: { request: string; relayState: string }) => {
    const attributes = await extractSAMLRequestAttributes(await decodeBase64(request, true));

    if (!attributes.entityId) {
      throw new JacksonError("Missing 'Entity ID' in SAML Request.", 400);
    }

    if (!attributes.acsUrl) {
      throw new JacksonError("Missing 'ACS URL' in SAML Request.", 400);
    }

    const app = await this.app.getByEntityId(attributes.entityId);

    if (app.acsUrl !== attributes.acsUrl) {
      throw new JacksonError("Assertion Consumer Service URL doesn't match.", 400);
    }

    const session: SPRequestSession = {
      app,
      request: {
        ...attributes,
        relayState,
      },
    };

    // Create a new session to store SP request information
    await this.session.put(relayState, session);

    const { authorizeUrl } = await this.createSAMLRequest(session);

    return {
      authorizeUrl,
    };
  };

  // Handle the SAML Response coming from an Identity Provider
  // and create a new SAML Response to be sent back to the Service Provider
  public generateSAMLResponseForm = async ({
    response,
    relayState,
  }: {
    response: string;
    relayState: string;
  }) => {
    const session = await this.session.get(relayState);

    if (!session) {
      throw new JacksonError('Unable to validate state from the origin request.', 404);
    }

    const certificate = await getDefaultCertificate();
    const decodedResponse = Buffer.from(response, 'base64').toString();
    const entityId = saml.parseIssuer(decodedResponse);

    if (!entityId) {
      throw new JacksonError("Missing 'Entity ID' in SAML Response.", 400);
    }

    // Find SAML connections for the app
    const connections: SAMLConnection[] = await this.connection.getByIndex({
      name: IndexNames.EntityID,
      value: entityId,
    });

    if (connections.length === 0) {
      throw new JacksonError('No SAML connection found.', 404);
    }

    const connection = connections[0];

    try {
      // Extract SAML Response attributes sent by the IdP
      const attributes = await extractSAMLResponseAttributes(decodedResponse, {
        thumbprint: connection.idpMetadata.thumbprint,
        audience: `${this.opts.samlAudience}`,
        privateKey: certificate.privateKey,
      });

      // Create a SAML Response to be sent back to the SP
      const { htmlForm } = await this.createSAMLResponse({ session, attributes });

      // Remove the session after we've created the SAML Response
      await this.session.delete(relayState);

      return { htmlForm };
    } catch (err) {
      throw new JacksonError('Unable to validate SAML Response.', 403);
    }
  };

  // Create a SAML Request to be sent to Identity Provider
  public createSAMLRequest = async ({ app, request }: SPRequestSession) => {
    const certificate = await getDefaultCertificate();

    // Find SAML connections for the app
    const connections = await this.connection.getByIndex({
      name: IndexNames.TenantProduct,
      value: dbutils.keyFromParts(app.tenant, app.product),
    });

    // Assume there is only one connection exists for now
    const connection = connections[0];

    const samlRequest = saml.request({
      ssoUrl: connection.idpMetadata.sso.redirectUrl,
      entityID: `${this.opts.samlAudience}`,
      callbackUrl: `${this.opts.externalUrl}/api/saml-federation/acs`,
      signingKey: certificate.privateKey,
      publicKey: certificate.publicKey,
    });

    const base64SamlRequest = Buffer.from(await deflateRawAsync(samlRequest.request)).toString('base64');

    const url = new URL(connection.idpMetadata.sso.redirectUrl);

    url.searchParams.set('RelayState', request.relayState); // We're reusing the RelayState coming from SP's SAML Request
    url.searchParams.set('SAMLRequest', base64SamlRequest);

    return { authorizeUrl: url.href };
  };

  // Create SAML Response to send back to the Service Provider
  public createSAMLResponse = async ({
    session,
    attributes,
  }: {
    session: SPRequestSession;
    attributes: SAMLProfile;
  }) => {
    const { request } = session;

    const certificate = await getDefaultCertificate();

    const xml = await createSAMLResponse({
      audience: request.entityId,
      acsUrl: request.acsUrl,
      issuer: `${this.opts.samlAudience}`,
      requestId: request.id,
      profile: {
        ...attributes,
      },
    });

    const xmlSigned = await signSAMLResponse(xml, certificate.privateKey, certificate.publicKey);

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

    return { htmlForm };
  };
}

type SPRequestSession = {
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
