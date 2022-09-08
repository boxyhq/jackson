import type {
  IAdminController,
  IAPIController,
  IdPConfig,
  ILogoutController,
  IOAuthController,
  IHealthCheckController,
  DirectorySync,
  DirectoryType,
  Directory,
  User,
  Group,
  DirectorySyncEvent,
  HTTPMethod,
  DirectorySyncRequest,
  IOidcDiscoveryController,
  ISPSAMLConfig,
} from '@boxyhq/saml-jackson';

import jackson from '@boxyhq/saml-jackson';
import env from '@lib/env';
import '@lib/metrics';

let apiController: IAPIController;
let oauthController: IOAuthController;
let adminController: IAdminController;
let logoutController: ILogoutController;
let healthCheckController: IHealthCheckController;
let directorySyncController: DirectorySync;
let oidcDiscoveryController: IOidcDiscoveryController;
let spConfig: ISPSAMLConfig;

const g = global as any;

export default async function init() {
  if (
    !g.apiController ||
    !g.oauthController ||
    !g.adminController ||
    !g.healthCheckController ||
    !g.logoutController ||
    !g.directorySync ||
    !g.oidcDiscoveryController ||
    !g.spConfig
  ) {
    const ret = await jackson(env);
    apiController = ret.apiController;
    oauthController = ret.oauthController;
    adminController = ret.adminController;
    logoutController = ret.logoutController;
    healthCheckController = ret.healthCheckController;
    directorySyncController = ret.directorySync;
    oidcDiscoveryController = ret.oidcDiscoveryController;
    spConfig = ret.spConfig;

    g.apiController = apiController;
    g.oauthController = oauthController;
    g.adminController = adminController;
    g.logoutController = logoutController;
    g.healthCheckController = healthCheckController;
    g.directorySync = directorySyncController;
    g.oidcDiscoveryController = oidcDiscoveryController;
    g.spConfig = spConfig;
    g.isJacksonReady = true;
  } else {
    apiController = g.apiController;
    oauthController = g.oauthController;
    adminController = g.adminController;
    logoutController = g.logoutController;
    healthCheckController = g.healthCheckController;
    directorySyncController = g.directorySync;
    oidcDiscoveryController = g.oidcDiscoveryController;
    spConfig = g.spConfig;
  }

  return {
    spConfig,
    apiController,
    oauthController,
    adminController,
    logoutController,
    healthCheckController,
    directorySyncController,
    oidcDiscoveryController,
  };
}

export type {
  IdPConfig,
  DirectoryType,
  Directory,
  User,
  Group,
  DirectorySyncEvent,
  HTTPMethod,
  DirectorySyncRequest,
};
