import { AdminController } from './controller/admin';
import { ConnectionAPIController } from './controller/api';
import { OAuthController } from './controller/oauth';
import { HealthCheckController } from './controller/health-check';
import { LogoutController } from './controller/logout';
import { OidcDiscoveryController } from './controller/oidc-discovery';

import DB from './db/db';
import defaultDb from './db/defaultDb';
import readConfig from './read-config';
import { JacksonOption } from './typings';

const defaultOpts = (opts: JacksonOption): JacksonOption => {
  const newOpts = {
    ...opts,
  };

  if (!newOpts.externalUrl) {
    throw new Error('externalUrl is required');
  }

  if (!newOpts.samlPath) {
    throw new Error('samlPath is required');
  }

  if (!newOpts.oidcPath) {
    throw new Error('oidcPath is required');
  }

  newOpts.samlAudience = newOpts.samlAudience || 'https://saml.boxyhq.com';
  newOpts.preLoadedConfig = newOpts.preLoadedConfig || ''; // path to folder containing static SAML config that will be preloaded. This is useful for self-hosted deployments that only have to support a single tenant (or small number of known tenants).
  newOpts.idpEnabled = newOpts.idpEnabled === true;
  defaultDb(newOpts);

  newOpts.clientSecretVerifier = newOpts.clientSecretVerifier || 'dummy';
  newOpts.db.pageLimit = newOpts.db.pageLimit || 50;

  newOpts.openid = newOpts.openid || {};
  newOpts.openid.jwsAlg = newOpts.openid.jwsAlg || 'RS256';

  return newOpts;
};

export const controllers = async (
  opts: JacksonOption
): Promise<{
  apiController: ConnectionAPIController;
  connectionAPIController: ConnectionAPIController;
  oauthController: OAuthController;
  adminController: AdminController;
  logoutController: LogoutController;
  healthCheckController: HealthCheckController;
  oidcDiscoveryController: OidcDiscoveryController;
}> => {
  opts = defaultOpts(opts);

  const db = await DB.new(opts.db);

  const configStore = db.store('saml:config');
  const sessionStore = db.store('oauth:session', opts.db.ttl);
  const codeStore = db.store('oauth:code', opts.db.ttl);
  const tokenStore = db.store('oauth:token', opts.db.ttl);
  const healthCheckStore = db.store('_health:check');

  const connectionAPIController = new ConnectionAPIController({ configStore });
  const adminController = new AdminController({ configStore });
  const healthCheckController = new HealthCheckController({ healthCheckStore });
  await healthCheckController.init();
  const oauthController = new OAuthController({
    configStore,
    sessionStore,
    codeStore,
    tokenStore,
    opts,
  });

  const logoutController = new LogoutController({
    configStore,
    sessionStore,
    opts,
  });
  const oidcDiscoveryController = new OidcDiscoveryController({ opts });
  // write pre-loaded config if present
  if (opts.preLoadedConfig && opts.preLoadedConfig.length > 0) {
    const configs = await readConfig(opts.preLoadedConfig);

    for (const config of configs) {
      if (config.oidcDiscoveryUrl) {
        await connectionAPIController.createOIDCConfig(config);
      } else {
        await connectionAPIController.createSAMLConnection(config);
      }

      console.log(`loaded config for tenant "${config.tenant}" and product "${config.product}"`);
    }
  }

  const type = opts.db.engine === 'sql' && opts.db.type ? ' Type: ' + opts.db.type : '';

  console.log(`Using engine: ${opts.db.engine}.${type}`);

  return {
    apiController: connectionAPIController,
    connectionAPIController,
    oauthController,
    adminController,
    logoutController,
    healthCheckController,
    oidcDiscoveryController,
  };
};

export default controllers;

export * from './typings';
