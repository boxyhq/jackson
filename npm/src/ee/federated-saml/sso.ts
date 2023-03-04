import saml from '@boxyhq/saml20';

import { App } from './app';
import { JacksonError } from '../../controller/error';
import { SAMLHandler } from '../../controller/saml-handler';
import type { SAMLSSORecord } from '../../typings';
import { extractSAMLRequestAttributes } from '../../saml/lib';

export class SSO {
  private app: App;
  private samlHandler: SAMLHandler;

  constructor({ app, samlHandler }: { app: App; samlHandler: SAMLHandler }) {
    this.app = app;
    this.samlHandler = samlHandler;
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

    const response = await this.samlHandler.resolveConnection({
      tenant: app.tenant,
      product: app.product,
      idp_hint,
      authFlow: 'saml',
      samlFedAppId: app.id,
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

    const { redirectUrl } = await this.samlHandler.createSAMLRequest({
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
}
