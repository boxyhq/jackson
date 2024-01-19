import saml from '@boxyhq/saml20';

import { App } from './app';
import { JacksonError } from '../../controller/error';
import { SSOHandler } from '../../controller/sso-handler';
import type { JacksonOption, OIDCSSORecord, SAMLSSORecord, SAMLTracerInstance } from '../../typings';
import { extractSAMLRequestAttributes } from '../../saml/lib';
import { getErrorMessage, isConnectionActive } from '../../controller/utils';
import { throwIfInvalidLicense } from '../common/checkLicense';

const isSAMLConnection = (connection: SAMLSSORecord | OIDCSSORecord): connection is SAMLSSORecord => {
  return 'idpMetadata' in connection;
};

const isOIDCConnection = (connection: SAMLSSORecord | OIDCSSORecord): connection is OIDCSSORecord => {
  return !('idpMetadata' in connection);
};

export class SSO {
  private app: App;
  private ssoHandler: SSOHandler;
  private samlTracer: SAMLTracerInstance;
  private opts: JacksonOption;

  constructor({
    app,
    ssoHandler,
    samlTracer,
    opts,
  }: {
    app: App;
    ssoHandler: SSOHandler;
    samlTracer: SAMLTracerInstance;
    opts: JacksonOption;
  }) {
    this.app = app;
    this.ssoHandler = ssoHandler;
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

      const response = await this.ssoHandler.resolveConnection({
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
          redirect_url: response.redirectUrl,
          authorize_form: null,
        };
      }

      // If there is a connection, use that connection
      if ('connection' in response) {
        connection = response.connection;
      }

      if (!connection) {
        throw new JacksonError('No SSO connection found.', 404);
      }

      if (!isConnectionActive(connection)) {
        throw new JacksonError('SSO connection is deactivated. Please contact your administrator.', 403);
      }

      const requestParams = {
        id,
        acsUrl,
        entityId,
        publicKey,
        providerName,
        relayState,
        tenant: app.tenant,
        product: app.product,
      };

      // When SAML Request
      if (isSAMLConnection(connection)) {
        return await this.ssoHandler.createSAMLRequest({
          connection,
          requestParams,
        });
      }

      // When OIDC Request
      if (isOIDCConnection(connection)) {
        return await this.ssoHandler.createOIDCRequest({
          connection,
          requestParams,
        });
      }
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
