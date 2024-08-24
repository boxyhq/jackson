import { JacksonError } from '../../controller/error';
import { SSOHandler } from '../../controller/sso-handler';
import { isConnectionActive } from '../../controller/utils';
import { JacksonOption, OIDCIdPInitiatedReq, OIDCSSORecord } from '../../typings';
import { throwIfInvalidLicense } from '../common/checkLicense';
import { App } from './app';

export class IdPLogin {
  private ssoHandler: SSOHandler;
  private app: App;
  private opts: JacksonOption;

  constructor({ connectionStore, sessionStore, app, opts }) {
    this.app = app;
    this.opts = opts;

    this.ssoHandler = new SSOHandler({
      connection: connectionStore,
      session: sessionStore,
      opts,
    });
  }

  public async oidcInitiateLogin(
    body: OIDCIdPInitiatedReq & { idp_hint?: string },
    fedAppId: string // SAML Fed app only
  ): Promise<{ redirect_url: string }> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    let connection: OIDCSSORecord | undefined;
    // let requestedTenant;
    // let requestedProduct;

    const { idp_hint } = body;

    // get federated connection
    const fedApp = await this.app.get({
      id: fedAppId,
    });

    const response = await this.ssoHandler.resolveConnection({
      tenant: fedApp.tenant,
      product: fedApp.product,
      idp_hint,
      authFlow: 'idp-initiated',
      originalParams: { ...body },
      tenants: fedApp.tenants,
      idFedAppId: fedApp.id,
      fedType: fedApp.type, // will be saml
      idpInitiatorType: 'oidc',
    });

    if ('redirectUrl' in response) {
      return {
        redirect_url: response.redirectUrl,
      };
    }

    if ('connection' in response) {
      connection = response.connection as OIDCSSORecord;
      // requestedTenant = fedApp.tenant;
      // requestedProduct = fedApp.product;
    }

    if (!connection) {
      throw new JacksonError('IdP connection not found.', 403);
    }

    const connectionIsOIDC = 'oidcProvider' in connection && connection.oidcProvider !== undefined;

    if (!connectionIsOIDC) {
      throw new JacksonError('Could not find an OIDC connection for the SAML federated app', 400);
    }

    if (!isConnectionActive(connection)) {
      throw new JacksonError('OIDC connection is deactivated. Please contact your administrator.', 403);
    }

    const requestParams = {
      acsUrl: fedApp.acsUrl,
      entityId: fedApp.entityId,
      tenant: fedApp.tenant,
      product: fedApp.product,
    };

    return await this.ssoHandler.createOIDCRequest({
      connection,
      requestParams,
      mappings: fedApp.mappings,
    });
  }
}
