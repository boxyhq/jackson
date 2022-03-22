import jackson, {
  IAdminController,
  IAPIController,
  IdPConfig,
  ILogoutController,
  IOAuthController,
} from '@boxyhq/saml-jackson';
import env from '@lib/env';
import '@lib/metrics';

let apiController: IAPIController;
let oauthController: IOAuthController;
let adminController: IAdminController;
let logoutController: ILogoutController;

const g = global as any;

export default async function init() {
  if (!g.apiController || !g.oauthController || !g.adminController) {
    const ret = await jackson(env);
    apiController = ret.apiController;
    oauthController = ret.oauthController;
    adminController = ret.adminController;
    logoutController = ret.logoutController;

    g.apiController = apiController;
    g.oauthController = oauthController;
    g.adminController = adminController;
    g.logoutController = logoutController;
  } else {
    apiController = g.apiController;
    oauthController = g.oauthController;
    adminController = g.adminController;
    logoutController = g.logoutController;
  }

  return {
    apiController,
    oauthController,
    adminController,
    logoutController,
  };
}

export type { IdPConfig };
