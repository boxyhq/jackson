import type {
  IAdminController,
  IConnectionAPIController,
  ILogoutController,
  IOAuthController,
  IHealthCheckController,
  IDirectorySyncController,
  IOidcDiscoveryController,
  ISPSAMLConfig,
  SAMLFederation,
} from '@boxyhq/saml-jackson';

import jackson from '@boxyhq/saml-jackson';
import env from '@lib/env';
import '@lib/metrics';

let connectionAPIController: IConnectionAPIController;
let oauthController: IOAuthController;
let adminController: IAdminController;
let logoutController: ILogoutController;
let healthCheckController: IHealthCheckController;
let directorySyncController: IDirectorySyncController;
let oidcDiscoveryController: IOidcDiscoveryController;
let spConfig: ISPSAMLConfig;
let samlFederatedController: SAMLFederation;
let checkLicense: () => Promise<boolean>;

const g = global as any;

export default async function init() {
  if (
    !g.connectionAPIController ||
    !g.oauthController ||
    !g.adminController ||
    !g.healthCheckController ||
    !g.logoutController ||
    !g.directorySync ||
    !g.oidcDiscoveryController ||
    !g.spConfig ||
    !g.samlFederatedController
  ) {
    const ret = await jackson(env);
    connectionAPIController = ret.connectionAPIController;
    oauthController = ret.oauthController;
    adminController = ret.adminController;
    logoutController = ret.logoutController;
    healthCheckController = ret.healthCheckController;
    directorySyncController = ret.directorySyncController;
    oidcDiscoveryController = ret.oidcDiscoveryController;
    spConfig = ret.spConfig;
    samlFederatedController = ret.samlFederatedController;
    checkLicense = ret.checkLicense;

    g.connectionAPIController = connectionAPIController;
    g.oauthController = oauthController;
    g.adminController = adminController;
    g.logoutController = logoutController;
    g.healthCheckController = healthCheckController;
    g.directorySync = directorySyncController;
    g.oidcDiscoveryController = oidcDiscoveryController;
    g.spConfig = spConfig;
    g.isJacksonReady = true;
    g.samlFederatedController = samlFederatedController;
    g.checkLicense = checkLicense;
  } else {
    connectionAPIController = g.connectionAPIController;
    oauthController = g.oauthController;
    adminController = g.adminController;
    logoutController = g.logoutController;
    healthCheckController = g.healthCheckController;
    directorySyncController = g.directorySync;
    oidcDiscoveryController = g.oidcDiscoveryController;
    spConfig = g.spConfig;
    samlFederatedController = g.samlFederatedController;
    checkLicense = g.checkLicense;
  }

  return {
    spConfig,
    connectionAPIController,
    oauthController,
    adminController,
    logoutController,
    healthCheckController,
    directorySyncController,
    oidcDiscoveryController,
    samlFederatedController,
    checkLicense,
  };
}
