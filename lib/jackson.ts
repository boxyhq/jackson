import type {
  IAdminController,
  IConnectionAPIController,
  SAMLSSOConnectionWithEncodedMetadata,
  SAMLSSOConnectionWithRawMetadata,
  OIDCSSOConnection,
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
  GetConnectionsQuery,
  GetConfigQuery,
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
let directorySyncController: DirectorySync;
let oidcDiscoveryController: IOidcDiscoveryController;
let spConfig: ISPSAMLConfig;
let samlFederation: SAMLFederation;

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
    !g.spConfig
  ) {
    const ret = await jackson(env);
    connectionAPIController = ret.connectionAPIController;
    oauthController = ret.oauthController;
    adminController = ret.adminController;
    logoutController = ret.logoutController;
    healthCheckController = ret.healthCheckController;
    directorySyncController = ret.directorySync;
    oidcDiscoveryController = ret.oidcDiscoveryController;
    spConfig = ret.spConfig;
    samlFederation = ret.samlFederation;

    g.connectionAPIController = connectionAPIController;
    g.oauthController = oauthController;
    g.adminController = adminController;
    g.logoutController = logoutController;
    g.healthCheckController = healthCheckController;
    g.directorySync = directorySyncController;
    g.oidcDiscoveryController = oidcDiscoveryController;
    g.spConfig = spConfig;
    g.isJacksonReady = true;
    g.samlFederation = samlFederation;
  } else {
    connectionAPIController = g.connectionAPIController;
    oauthController = g.oauthController;
    adminController = g.adminController;
    logoutController = g.logoutController;
    healthCheckController = g.healthCheckController;
    directorySyncController = g.directorySync;
    oidcDiscoveryController = g.oidcDiscoveryController;
    spConfig = g.spConfig;
    samlFederation = g.samlFederation;
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
    samlFederation,
  };
}

export type {
  SAMLSSOConnectionWithEncodedMetadata,
  SAMLSSOConnectionWithRawMetadata,
  OIDCSSOConnection,
  DirectoryType,
  Directory,
  User,
  Group,
  DirectorySyncEvent,
  HTTPMethod,
  DirectorySyncRequest,
  GetConnectionsQuery,
  GetConfigQuery,
};
