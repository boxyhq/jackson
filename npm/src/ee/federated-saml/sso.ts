import saml from '@boxyhq/saml20';

import { App } from './app';
import { JacksonError } from '../../controller/error';
import { SAMLHandler } from '../../controller/sso-handler';
import type { JacksonOption, OIDCSSORecord, SAMLSSORecord, SAMLTracerInstance } from '../../typings';
import { extractSAMLRequestAttributes } from '../../saml/lib';
import { getErrorMessage, isConnectionActive } from '../../controller/utils';
import { throwIfInvalidLicense } from '../common/checkLicense';

export class SSO {
  private app: App;
  private samlHandler: SAMLHandler;
  private samlTracer: SAMLTracerInstance;
  private opts: JacksonOption;

  constructor({
    app,
    samlHandler,
    samlTracer,
    opts,
  }: {
    app: App;
    samlHandler: SAMLHandler;
    samlTracer: SAMLTracerInstance;
    opts: JacksonOption;
  }) {
    this.app = app;
    this.samlHandler = samlHandler;
    this.samlTracer = samlTracer;
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
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    let connection: SAMLSSORecord | OIDCSSORecord | undefined;
    let id, acsUrl, entityId, publicKey, providerName, decodedRequest, app;

    try {
      const parsedSAMLRequest = await extractSAMLRequestAttributes(request);

      id = parsedSAMLRequest.id;
      acsUrl = parsedSAMLRequest.acsUrl;
      entityId = parsedSAMLRequest.entityId;
      publicKey = parsedSAMLRequest.publicKey;
      providerName = parsedSAMLRequest.providerName;
      decodedRequest = parsedSAMLRequest.decodedRequest;

      // Verify the request if it is signed
      if (publicKey && !saml.hasValidSignature(request, publicKey, null)) {
        throw new JacksonError('Invalid SAML Request signature.', 400);
      }

      app = await this.app.getByEntityId(entityId);

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

      console.log('resolveConnection', response);

      // If there is a redirect URL, then we need to redirect to that URL
      if ('redirectUrl' in response) {
        return {
          redirect_url: response.redirectUrl,
          authorize_form: null,
        };
      }

      // If there is a connection, use that connection
      if ('connection' in response) {
        connection = response.connection;
      }

      if (!connection) {
        throw new JacksonError('No SAML connection found.', 404);
      }

      if (!isConnectionActive(connection)) {
        throw new JacksonError('SSO connection is deactivated. Please contact your administrator.', 403);
      }

      // if connection is SAML, call createSAMLRequest or call createOIDCRequest

      return await this.samlHandler.createSAMLRequest({
        connection,
        requestParams: {
          id,
          acsUrl,
          entityId,
          publicKey,
          providerName,
          relayState,
          tenant: app.tenant,
          product: app.product,
        },
      });
    } catch (err: unknown) {
      const error_description = getErrorMessage(err);

      this.samlTracer.saveTrace({
        error: error_description,
        context: {
          tenant: app?.tenant || '',
          product: app?.product || '',
          clientID: connection?.clientID || '',
          isSAMLFederated: true,
          providerName,
          acsUrl,
          entityId,
          samlRequest: decodedRequest,
        },
      });

      throw err;
    }
  };
}
