import type {
  IAdminController,
  IAPIController,
  IdPConfig,
  ILogoutController,
  IOAuthController,
  IHealthCheckController,
  ISCIMController,
  IUsersController,
  IGroupsController,
} from '@boxyhq/saml-jackson';

import jackson from '@boxyhq/saml-jackson';
import env from '@lib/env';
import '@lib/metrics';

let apiController: IAPIController;
let oauthController: IOAuthController;
let adminController: IAdminController;
let logoutController: ILogoutController;
let healthCheckController: IHealthCheckController;
let scimController: ISCIMController;
let usersController: IUsersController;
let groupsController: IGroupsController;
let scim: any;

const g = global as any;

export default async function init() {
  if (
    !g.apiController ||
    !g.oauthController ||
    !g.adminController ||
    !g.healthCheckController ||
    !g.logoutController ||
    !g.scimController ||
    !g.usersController ||
    !g.groupsController ||
    !g.scim
  ) {
    const ret = await jackson(env);
    apiController = ret.apiController;
    oauthController = ret.oauthController;
    adminController = ret.adminController;
    logoutController = ret.logoutController;
    healthCheckController = ret.healthCheckController;
    scimController = ret.scimController;
    usersController = ret.usersController;
    groupsController = ret.groupsController;
    scim = ret.scim;

    g.apiController = apiController;
    g.oauthController = oauthController;
    g.adminController = adminController;
    g.logoutController = logoutController;
    g.healthCheckController = healthCheckController;
    g.scimController = scimController;
    g.usersController = usersController;
    g.groupsController = groupsController;
    g.scim = scim;
    g.isJacksonReady = true;
  } else {
    apiController = g.apiController;
    oauthController = g.oauthController;
    adminController = g.adminController;
    logoutController = g.logoutController;
    healthCheckController = g.healthCheckController;
    scimController = g.scimController;
    usersController = g.usersController;
    groupsController = g.groupsController;
    scim = g.scim;
  }

  return {
    apiController,
    oauthController,
    adminController,
    logoutController,
    healthCheckController,
    scimController,
    usersController,
    groupsController,
    scim,
  };
}

export type { IdPConfig };
