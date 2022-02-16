import { APIController } from './controller/api';
import { OAuthController } from './controller/oauth';
import { AdminController } from './controller/admin';
import DB from './db/db';
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

  newOpts.samlAudience = newOpts.samlAudience || 'https://saml.boxyhq.com';
  newOpts.preLoadedConfig = newOpts.preLoadedConfig || ''; // path to folder containing static SAML config that will be preloaded. This is useful for self-hosted deployments that only have to support a single tenant (or small number of known tenants).
  newOpts.idpEnabled = newOpts.idpEnabled === true;

  newOpts.db = newOpts.db || {};
  newOpts.db.engine = newOpts.db.engine || 'sql';
  newOpts.db.url = newOpts.db.url || 'postgresql://postgres:postgres@localhost:5432/postgres';
  newOpts.db.type = newOpts.db.type || 'postgres'; // Only needed if DB_ENGINE is sql.
  newOpts.db.ttl = (newOpts.db.ttl || 300) * 1; // TTL for the code, session and token stores (in seconds)
  newOpts.db.cleanupLimit = (newOpts.db.cleanupLimit || 1000) * 1; // Limit cleanup of TTL entries to this many items at a time

  newOpts.clientSecretVerifier = newOpts.clientSecretVerifier || 'dummy';

  return newOpts;
};

export const controllers = async (
  opts: JacksonOption
): Promise<{
  apiController: APIController;
  oauthController: OAuthController;
  adminController: AdminController;
}> => {
  opts = defaultOpts(opts);

  const db = await DB.new(opts.db);

  const configStore = db.store('saml:config');
  const sessionStore = db.store('oauth:session', opts.db.ttl);
  const codeStore = db.store('oauth:code', opts.db.ttl);
  const tokenStore = db.store('oauth:token', opts.db.ttl);

  const apiController = new APIController({ configStore });
  const adminController = new AdminController({ configStore });
  const oauthController = new OAuthController({
    configStore,
    sessionStore,
    codeStore,
    tokenStore,
    opts,
  });

  // write pre-loaded config if present
  if (opts.preLoadedConfig && opts.preLoadedConfig.length > 0) {
    const configs = await readConfig(opts.preLoadedConfig);

    for (const config of configs) {
      await apiController.config(config);

      console.log(`loaded config for tenant "${config.tenant}" and product "${config.product}"`);
    }
  }

  const type = opts.db.engine === 'sql' && opts.db.type ? ' Type: ' + opts.db.type : '';

  console.log(`Using engine: ${opts.db.engine}.${type}`);

  return {
    apiController,
    oauthController,
    adminController,
  };
};

export default controllers;

export * from './typings';
