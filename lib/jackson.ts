import jackson, { IAdminController, IAPIController, IOAuthController, IdPConfig } from '@boxyhq/saml-jackson';
import env from '@lib/env';
import '@lib/metrics';

let apiController: IAPIController;
let oauthController: IOAuthController;
let adminController: IAdminController;

const g = global as any;

export default async function init() {
  if (!g.apiController || !g.oauthController || !g.adminController) {
    const ret = await jackson(env);
    apiController = ret.apiController;
    oauthController = ret.oauthController;
    adminController = ret.adminController;
    g.apiController = apiController;
    g.oauthController = oauthController;
    g.adminController = adminController;
  } else {
    apiController = g.apiController;
    oauthController = g.oauthController;
    adminController = g.adminController;
  }

  return {
    apiController,
    oauthController,
    adminController,
  };
}

export type { IdPConfig };
