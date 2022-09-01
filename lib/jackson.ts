import jackson, {
  IAdminController,
  IConnectionAPIController,
  IdPConnection,
  ILogoutController,
  IOAuthController,
  IHealthCheckController,
  IOidcDiscoveryController,
} from '@boxyhq/saml-jackson';
import env from '@lib/env';
import '@lib/metrics';

let connectionAPIController: IConnectionAPIController;
let oauthController: IOAuthController;
let adminController: IAdminController;
let logoutController: ILogoutController;
let healthCheckController: IHealthCheckController;
let oidcDiscoveryController: IOidcDiscoveryController;

const g = global as any;

export default async function init() {
  if (
    !g.connectionAPIController ||
    !g.oauthController ||
    !g.adminController ||
    !g.healthCheckController ||
    !g.logoutController ||
    !g.oidcDiscoveryController
  ) {
    const ret = await jackson(env);
    connectionAPIController = ret.connectionAPIController;
    oauthController = ret.oauthController;
    adminController = ret.adminController;
    logoutController = ret.logoutController;
    healthCheckController = ret.healthCheckController;
    oidcDiscoveryController = ret.oidcDiscoveryController;

    g.connectionAPIController = connectionAPIController;
    g.oauthController = oauthController;
    g.adminController = adminController;
    g.logoutController = logoutController;
    g.healthCheckController = healthCheckController;
    g.oidcDiscoveryController = oidcDiscoveryController;
    g.isJacksonReady = true;
  } else {
    connectionAPIController = g.connectionAPIController;
    oauthController = g.oauthController;
    adminController = g.adminController;
    logoutController = g.logoutController;
    healthCheckController = g.healthCheckController;
    oidcDiscoveryController = g.oidcDiscoveryController;
  }

  return {
    connectionAPIController,
    oauthController,
    adminController,
    logoutController,
    healthCheckController,
    oidcDiscoveryController,
  };
}

export type { IdPConnection };
