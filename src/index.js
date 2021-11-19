const DB = require('./db/db.js');
const readConfig = require('./read-config.js');

const defaultOpts = (opts) => {
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
  newOpts.db.engine = newOpts.db.engine || 'sql'; // Supported values: redis, sql, mongo, mem. Keep comment in sync with db.js
  newOpts.db.url =
    newOpts.db.url || 'postgres://postgres:postgres@localhost:5432/jackson';
  newOpts.db.type = newOpts.db.type || 'postgres'; // Only needed if DB_ENGINE is sql. Supported values: postgres, cockroachdb, mysql, mariadb
  newOpts.db.ttl = (newOpts.db.ttl || 300) * 1; // TTL for the code, session and token stores (in seconds)
  newOpts.db.limit = (newOpts.db.limit || 1000) * 1; // Limit ttl cleanup to this many items at a time

  return newOpts;
};

module.exports = async function (opts) {
  opts = defaultOpts(opts);

  const db = await DB.new(opts.db);
  const configStore = db.store('saml:config');
  const sessionStore = db.store('oauth:session', opts.db.ttl);
  const codeStore = db.store('oauth:code', opts.db.ttl);
  const tokenStore = db.store('oauth:token', opts.db.ttl);

  const apiController = require('./controller/api.js')({ configStore });
  const oauthController = require('./controller/oauth.js')({
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
      console.log(
        `loaded config for tenant "${config.tenant}" and product "${config.product}"`
      );
    }
  }

  console.log(`Using engine: ${opts.db.engine}`);

  return {
    apiController,
    oauthController,
  };
};
