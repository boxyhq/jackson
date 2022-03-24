import jackson, {
  IAdminController,
  IAPIController,
  IOAuthController,
  IdPConfig,
  IHealthCheckController,
} from '@boxyhq/saml-jackson';
import env from '@lib/env';
import '@lib/metrics';

let apiController: IAPIController;
let oauthController: IOAuthController;
let adminController: IAdminController;
let healthCheckController: IHealthCheckController;

const g = global as any;

export default async function init() {
  if (!g.apiController || !g.oauthController || !g.adminController || !g.healthCheckController) {
    const ret = await jackson(env);
    apiController = ret.apiController;
    oauthController = ret.oauthController;
    adminController = ret.adminController;
    healthCheckController = ret.healthCheckController;
    g.apiController = apiController;
    g.oauthController = oauthController;
    g.adminController = adminController;
    g.healthCheckController = healthCheckController;
    g.isJacksonReady = true;
  } else {
    apiController = g.apiController;
    oauthController = g.oauthController;
    adminController = g.adminController;
    g.healthCheckController = healthCheckController;
  }

  return {
    apiController,
    oauthController,
    adminController,
    healthCheckController,
  };
}

export type { IdPConfig };
