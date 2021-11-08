const DB = require('./db/db.js');
const env = require('./env.js');
const readConfig = require('./read-config.js');

module.exports = async function (samlPath) {
  const db = await DB.new(env.db);
  const configStore = db.store('saml:config');
  const sessionStore = db.store('oauth:session', 300);
  const codeStore = db.store('oauth:code', 300);
  const tokenStore = db.store('oauth:token', 300);

  const configController = require('./controller/config.js')({ configStore });
  const oauthController = require('./controller/oauth.js')({
    configStore,
    sessionStore,
    codeStore,
    tokenStore,
    samlPath,
  });
  // write pre-loaded config if present
  if (env.preLoadedConfig && env.preLoadedConfig.length > 0) {
    const configs = await readConfig(env.preLoadedConfig);

    for (const config of configs) {
      await configController(config);
      console.log(
        `loaded config for tenant "${config.tenant}" and product "${config.product}"`
      );
    }
  }

  console.log(`Using engine: ${env.db.engine}`);

  return {
    configController,
    oauthController,
  };
};
