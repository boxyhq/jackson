import { JacksonError } from '../../controller/error';
import { SSOHandler } from '../../controller/sso-handler';
import { getErrorMessage, isConnectionActive } from '../../controller/utils';
import {
  IdentityFederationApp,
  JacksonOption,
  OIDCIdPInitiatedReq,
  OIDCSSORecord,
  SSOTrace,
  SSOTracesInstance,
} from '../../typings';
import { throwIfInvalidLicense } from '../common/checkLicense';
import { App } from './app';

export class IdPLogin {
  private ssoHandler: SSOHandler;
  private ssoTraces: SSOTracesInstance;
  private app: App;
  private opts: JacksonOption;

  constructor({ app, ssoHandler, ssoTraces, opts }) {
    this.app = app;
    this.ssoHandler = ssoHandler;
    this.ssoTraces = ssoTraces;
    this.opts = opts;
  }

  // Supported for SAML Federation only
  public async oidcInitiateLogin(
    body: OIDCIdPInitiatedReq & { fedAppId: string }
  ): Promise<{ redirect_url: string }> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    let connection: OIDCSSORecord | undefined;
    let fedApp: IdentityFederationApp | undefined;
    const { iss, target_link_uri, fedAppId } = body;
    const context = {
      isSAMLFederated: true,
      relayState: target_link_uri,
      isIdPFlow: true,
      oidcIdPRequest: body,
    } as unknown as SSOTrace['context'];

    try {
      // get federated connection
      fedApp = await this.app.get({
        id: fedAppId,
      });

      const requestedTenant = fedApp.tenant;
      const requestedProduct = fedApp.product;

      context.tenant = requestedTenant;
      context.product = requestedProduct;

      if (fedApp.type !== 'saml') {
        throw new JacksonError(
          'Third party login from an OIDC provider is only supported with SAML Federation',
          400
        );
      }

      const response = await this.ssoHandler.resolveConnection({
        tenant: requestedTenant,
        product: requestedProduct,
        authFlow: 'idp-initiated',
        originalParams: { ...body },
        tenants: fedApp.tenants,
        idFedAppId: fedApp.id,
        fedType: fedApp.type, // will be saml
        thirdPartyLogin: { idpInitiatorType: 'oidc', iss, target_link_uri },
        ssoTraces: { instance: this.ssoTraces, context },
      });

      if ('connection' in response) {
        connection = response.connection as OIDCSSORecord;
      }

      if (!connection) {
        throw new JacksonError('IdP connection not found.', 404);
      }

      context.clientID = connection.clientID;
      context.providerName = connection?.oidcProvider.friendlyProviderName || '';
      context.acsUrl = fedApp.acsUrl;
      context.entityId = fedApp.entityId;

      if (!isConnectionActive(connection)) {
        throw new JacksonError('OIDC connection is deactivated. Please contact your administrator.', 403);
      }

      const requestParams = {
        acsUrl: fedApp.acsUrl,
        entityId: fedApp.entityId,
        tenant: fedApp.tenant,
        product: fedApp.product,
        relayState: target_link_uri,
        oidcIdPRequest: body,
      };

      return await this.ssoHandler.createOIDCRequest({
        connection,
        requestParams,
        mappings: fedApp.mappings,
        ssoTraces: {
          instance: this.ssoTraces,
          context,
        },
      });
    } catch (err: unknown) {
      const error_description = getErrorMessage(err);

      this.ssoTraces.saveTrace({
        error: error_description,
        context,
      });

      throw err;
    }
  }
}
