import type { SAMLProfile } from '@boxyhq/saml20/dist/typings';
import saml from '@boxyhq/saml20';
import crypto from 'crypto';

import type { JacksonOption, SAMLConnection, SAMLSSOConnection, SAMLSSORecord, Storable } from '../typings';
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
    const { id, acsUrl, entityId, publicKey, providerName } = await extractSAMLRequestAttributes(
      await decodeBase64(request, true)
    );

    if (!entityId) {
      throw new JacksonError("Missing 'Entity ID' in SAML Request.", 400);
    }

    if (!acsUrl) {
      throw new JacksonError("Missing 'ACS URL' in SAML Request.", 400);
    }

    const app = await this.app.getByEntityId(entityId);

    if (app.acsUrl !== acsUrl) {
      throw new JacksonError("Assertion Consumer Service URL doesn't match.", 400);
    }

    const sessionId = crypto.randomBytes(16).toString('hex');

    const session: SPRequestSession = {
      app,
      request: {
        id,
        acsUrl,
        entityId,
        publicKey,
        providerName,
        relayState,
      },
    };

    // Create a new session to store SP request information
    await this.session.put(sessionId, session);

    const { redirectUrl } = await this._createSAMLRequest({
      tenant: app.tenant,
      product: app.product,
      relayState: `${relayStatePrefix}${sessionId}`,
    });

    return {
      redirectUrl,
    };
  };

  // Handle the SAML Response coming from an Identity Provider
  // and create a new SAML Response to be sent back to the Service Provider
  public generateSAMLResponse = async ({
    response,
    relayState,
  }: {
    response: string;
    relayState: string;
  }) => {
    if (!response) {
      throw new JacksonError('Missing SAMLResponse.', 400);
    }

    if (!relayState || !relayState.startsWith(relayStatePrefix)) {
      throw new JacksonError('Invalid RelayState', 400);
    }

    const sessionId = relayState.replace(relayStatePrefix, '');

    const session = await this.session.get(sessionId);

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

    if (!connections || connections.length === 0) {
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
      await this.session.delete(sessionId);

      return { htmlForm };
    } catch (err) {
      throw new JacksonError('Unable to validate SAML Response.', 403);
    }
  };

  // Create a SAML Request to be sent to Identity Provider
  private _createSAMLRequest = async ({
    tenant,
    product,
    relayState,
  }: {
    tenant: string;
    product: string;
    relayState: string;
  }) => {
    const certificate = await getDefaultCertificate();

    // Find SAML connections for the app
    const connections = await this.connection.getByIndex({
      name: IndexNames.TenantProduct,
      value: dbutils.keyFromParts(tenant, product),
    });

    if (!connections || connections.length === 0) {
      throw new JacksonError('No SAML connection found.', 404);
    }

    console.log(connections);

    // If more than one, redirect to the connection selection page
    if (connections.length > 1) {
      return {
        redirectUrl: `${this.opts.externalUrl}/idp/choose-connection?tenant=${tenant}&product=${product}&relayState=${relayState}`,
      };
    }

    // If only one connection, use it
    const connection = connections[0];

    const samlRequest = saml.request({
      ssoUrl: connection.idpMetadata.sso.redirectUrl,
      entityID: `${this.opts.samlAudience}`,
      callbackUrl: `${this.opts.externalUrl}/api/saml-federation/acs`,
      signingKey: certificate.privateKey,
      publicKey: certificate.publicKey,
    });

    const base64SamlRequest = Buffer.from(await deflateRawAsync(samlRequest.request)).toString('base64');

    return {
      redirectUrl: `${connection.idpMetadata.sso.redirectUrl}?SAMLRequest=${base64SamlRequest}&RelayState=${relayState}`,
    };
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

  // Handle the IdP selection after the user select an IdP from the list of IdPs
  public handleIdPSelection = async ({
    tenant,
    product,
    relayState,
    entityId,
  }: {
    tenant: string;
    product: string;
    relayState: string;
    entityId: string;
  }) => {
    console.info({ tenant, product, relayState, entityId });
  };

  public getConnections = async ({
    tenant,
    product,
    relayState,
  }: {
    tenant: string;
    product: string;
    relayState: string;
  }) => {
    // TODO: Validate relayState
    // TODO: Check the user is asking for tenant and product that he has access to

    console.log(relayState);

    const connections: SAMLSSORecord[] = await this.connection.getByIndex({
      name: IndexNames.TenantProduct,
      value: dbutils.keyFromParts(tenant, product),
    });

    if (!connections || connections.length === 0) {
      throw new JacksonError('No SAML connection found.', 404);
    }

    // TODO: Only return necessary fields

    console.log(connections);

    return connections;
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
