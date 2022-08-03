import jackson, {
  IAdminController,
  IConfigAPIController,
  IdPConfig,
  ILogoutController,
  IOAuthController,
  IHealthCheckController,
  IOidcDiscoveryController,
} from '@boxyhq/saml-jackson';
import env from '@lib/env';
import '@lib/metrics';

let configAPIController: IConfigAPIController;
let oauthController: IOAuthController;
let adminController: IAdminController;
let logoutController: ILogoutController;
let healthCheckController: IHealthCheckController;
let oidcDiscoveryController: IOidcDiscoveryController;

const g = global as any;

export default async function init() {
  if (
    !g.configAPIController ||
    !g.oauthController ||
    !g.adminController ||
    !g.healthCheckController ||
    !g.logoutController ||
    !g.oidcDiscoveryController
  ) {
    const ret = await jackson(env);
    configAPIController = ret.configAPIController;
    oauthController = ret.oauthController;
    adminController = ret.adminController;
    logoutController = ret.logoutController;
    healthCheckController = ret.healthCheckController;
    oidcDiscoveryController = ret.oidcDiscoveryController;

    g.configAPIController = configAPIController;
    g.oauthController = oauthController;
    g.adminController = adminController;
    g.logoutController = logoutController;
    g.healthCheckController = healthCheckController;
    g.oidcDiscoveryController = oidcDiscoveryController;
    g.isJacksonReady = true;
  } else {
    configAPIController = g.configAPIController;
    oauthController = g.oauthController;
    adminController = g.adminController;
    logoutController = g.logoutController;
    healthCheckController = g.healthCheckController;
    oidcDiscoveryController = g.oidcDiscoveryController;
  }

  return {
    configAPIController,
    oauthController,
    adminController,
    logoutController,
    healthCheckController,
    oidcDiscoveryController,
  };
}

export type { IdPConfig };
