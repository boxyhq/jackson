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
  DirectorySyncUserRequest,
  DirectorySyncGroupRequest,
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

const g = global as any;

export default async function init() {
  if (
    !g.apiController ||
    !g.oauthController ||
    !g.adminController ||
    !g.healthCheckController ||
    !g.logoutController ||
    !g.directorySync
  ) {
    const ret = await jackson(env);
    apiController = ret.apiController;
    oauthController = ret.oauthController;
    adminController = ret.adminController;
    logoutController = ret.logoutController;
    healthCheckController = ret.healthCheckController;
    directorySyncController = ret.directorySync;

    g.apiController = apiController;
    g.oauthController = oauthController;
    g.adminController = adminController;
    g.logoutController = logoutController;
    g.healthCheckController = healthCheckController;
    g.directorySync = directorySyncController;
    g.isJacksonReady = true;
  } else {
    apiController = g.apiController;
    oauthController = g.oauthController;
    adminController = g.adminController;
    logoutController = g.logoutController;
    healthCheckController = g.healthCheckController;
    directorySyncController = g.directorySync;
  }

  return {
    apiController,
    oauthController,
    adminController,
    logoutController,
    healthCheckController,
    directorySyncController,
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
  DirectorySyncUserRequest,
  DirectorySyncGroupRequest,
};
