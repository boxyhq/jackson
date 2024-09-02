import { JacksonError } from '../../controller/error';
import { SSOHandler } from '../../controller/sso-handler';
  SSOTracesInstance,
import { throwIfInvalidLicense } from '../common/checkLicense';
import { App } from './app';

export class IdPLogin {
  private ssoHandler: SSOHandler;
  private ssoTraces: SSOTracesInstance;
  private app: App;
  private opts: JacksonOption;

  constructor({ connectionStore, sessionStore, app, opts }) {
    this.app = app;
    this.ssoHandler = ssoHandler;
    this.ssoTraces = ssoTraces;
    this.opts = opts;
  }

  public async oidcInitiateLogin(
    body: OIDCIdPInitiatedReq & { idp_hint?: string },
    fedAppId: string // SAML Fed app only
  ): Promise<{ redirect_url: string }> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    let connection: OIDCSSORecord | undefined;

    const { iss, target_link_uri, idp_hint } = body;

    // get federated connection
    const fedApp = await this.app.get({
      id: fedAppId,
    });

    if (fedApp.type !== 'saml') {
      throw new JacksonError(
        'Third party login from an OIDC provider is only supported with SAML Federation',
        400
      );
    }

    const requestedTenant = fedApp.tenant;
    const requestedProduct = fedApp.product;

    const response = await this.ssoHandler.resolveConnection({
      tenant: requestedTenant,
      product: requestedProduct,
      idp_hint,
      authFlow: 'idp-initiated',
      originalParams: { ...body },
      tenants: fedApp.tenants,
      idFedAppId: fedApp.id,
      fedType: fedApp.type, // will be saml
      thirdPartyLogin: { idpInitiatorType: 'oidc', iss, target_link_uri },
    });

    if ('connection' in response) {
      connection = response.connection as OIDCSSORecord;
    }

    if (!connection) {
      throw new JacksonError('IdP connection not found.', 404);
    }

    if (!isConnectionActive(connection)) {
      throw new JacksonError('OIDC connection is deactivated. Please contact your administrator.', 403);
    }

    const requestParams = {
      acsUrl: fedApp.acsUrl,
      entityId: fedApp.entityId,
      tenant: fedApp.tenant,
      product: fedApp.product,
      relayState: target_link_uri,
    };

    return await this.ssoHandler.createOIDCRequest({
      connection,
      requestParams,
      mappings: fedApp.mappings,
    });
  }
}
