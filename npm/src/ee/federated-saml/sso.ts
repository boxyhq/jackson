import saml from '@boxyhq/saml20';

import { App } from './app';
import { JacksonError } from '../../controller/error';
import { SSOHandler } from '../../controller/sso-handler';
import type {
  JacksonOption,
  OIDCSSORecord,
  SAMLFederationApp,
  SAMLSSORecord,
  SSOTracerInstance,
} from '../../typings';
import { getErrorMessage, isConnectionActive } from '../../controller/utils';
import { throwIfInvalidLicense } from '../common/checkLicense';

const isSAMLConnection = (connection: SAMLSSORecord | OIDCSSORecord): connection is SAMLSSORecord => {
  return 'idpMetadata' in connection;
};

export class SSO {
  private app: App;
  private ssoHandler: SSOHandler;
  private ssoTracer: SSOTracerInstance;
  private opts: JacksonOption;

  constructor({
    app,
    ssoHandler,
    ssoTracer,
    opts,
  }: {
    app: App;
    ssoHandler: SSOHandler;
    ssoTracer: SSOTracerInstance;
    opts: JacksonOption;
  }) {
    this.app = app;
    this.ssoHandler = ssoHandler;
    this.ssoTracer = ssoTracer;
    this.opts = opts;
  }

  // Accept the SAML Request from Service Provider, and create a new SAML Request to be sent to Identity Provider
  public getAuthorizeUrl = async ({
    request,
    relayState,
    idp_hint,
    samlBinding,
  }: {
    request: string;
    relayState: string;
    samlBinding: 'HTTP-POST' | 'HTTP-Redirect';
    idp_hint?: string;
  }) => {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const isPostBinding = samlBinding === 'HTTP-POST';
    let connection: SAMLSSORecord | OIDCSSORecord | undefined;
    let app: SAMLFederationApp | undefined;
    let id, acsUrl, entityId, publicKey, providerName, decodedRequest;

    try {
      decodedRequest = await saml.decodeBase64(request, !isPostBinding);

      const parsedSAMLRequest = await saml.parseSAMLRequest(decodedRequest, isPostBinding);

      id = parsedSAMLRequest.id;
      entityId = parsedSAMLRequest.audience;
      publicKey = parsedSAMLRequest.publicKey;
      providerName = parsedSAMLRequest.providerName;

      // Verify the request if it is signed
      if (publicKey && !saml.hasValidSignature(decodedRequest, publicKey, null)) {
        throw new JacksonError('Invalid SAML Request signature.', 400);
      }

      app = await this.app.getByEntityId(entityId);
      acsUrl = parsedSAMLRequest.acsUrl || app.acsUrl; // acsUrl is optional in the SAMLRequest

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
          samlBinding,
        },
        tenants: app.tenants,
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

      return isSAMLConnection(connection)
        ? await this.ssoHandler.createSAMLRequest({
            connection,
            requestParams,
            mappings: app.mappings,
          })
        : await this.ssoHandler.createOIDCRequest({
            connection,
            requestParams,
            mappings: app.mappings,
          });
    } catch (err: unknown) {
      const error_description = getErrorMessage(err);

      this.ssoTracer.saveTrace({
        error: error_description,
        context: {
          tenant: app?.tenant || '',
          product: app?.product || '',
          clientID: connection?.clientID || '',
          isSAMLFederated: true,
          relayState,
          providerName,
          acsUrl,
          entityId,
          samlRequest: decodedRequest || request,
        },
      });

      throw err;
    }
  };
}
