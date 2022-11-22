import saml from '@boxyhq/saml20';

import type { JacksonOption, SAMLConnection, SAMLSSORecord, Storable } from '../typings';
import type { SAMLFederationApp } from './app';
import { createSAMLResponse, extractSAMLRequestAttributes } from './utils';
import { SSOConnection } from '../controller/sso-connection';
import { getDefaultCertificate } from '../saml/x509';
import { IndexNames } from '../controller/utils';
import { JacksonError } from '../controller/error';
import { App } from './app';
import { extractSAMLResponseAttributes } from '../saml/lib';

// Used to identify the relay state as a federated SAML request
const relayStatePrefix = 'federated_saml_';

export class SSOHandler {
  private app: App;
  private session: Storable;
  private connection: Storable;
  private opts: JacksonOption;
  private ssoConnection: SSOConnection;

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

    this.ssoConnection = new SSOConnection({
      connection,
      session,
      opts,
    });
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

    const response = await this.ssoConnection.resolveConnection({
      tenant: app.tenant,
      product: app.product,
      idp_hint,
      authFlow: 'saml',
      originalParams: {
        RelayState: relayState,
        SAMLRequest: request,
      },
    });

    // If there is a redirect URL, then we need to redirect to that URL
    if ('redirectUrl' in response) {
      return {
        redirectUrl: response.redirectUrl,
      };
    }

    let connection: SAMLSSORecord | undefined;

    // If there is a connection, use that connection
    if ('connection' in response && 'idpMetadata' in response.connection) {
      connection = response.connection;
    }

    if (!connection) {
      throw new JacksonError('No SAML connection found.', 404);
    }

    const { redirectUrl } = await this.ssoConnection.createSAMLRequest({
      connection,
      requestParams: {
        id,
        acsUrl,
        entityId,
        publicKey,
        providerName,
        relayState,
      },
    });

    return {
      redirectUrl,
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
    const sessionId = relayState.replace(relayStatePrefix, '');

    const session: SPRequestSession = await this.session.get(sessionId);

    if (!session) {
      throw new JacksonError('Unable to validate state from the origin request.', 404);
    }

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
    const decodedResponse = Buffer.from(response, 'base64').toString();

    try {
      // Extract SAML Response attributes sent by the IdP
      const attributes = await extractSAMLResponseAttributes(decodedResponse, {
        thumbprint: connection.idpMetadata.thumbprint,
        audience: `${this.opts.samlAudience}`,
        privateKey: certificate.privateKey,
      });

      const responseSigned = await createSAMLResponse({
        audience: session.request.entityId,
        acsUrl: session.request.acsUrl,
        requestId: session.request.id,
        issuer: `${this.opts.samlAudience}`,
        profile: {
          ...attributes,
        },
        ...certificate,
      });

      const htmlForm = saml.createPostForm(session.request.acsUrl, [
        {
          name: 'RelayState',
          value: session.request.relayState,
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
