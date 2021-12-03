const saml = require('../saml/saml.js');
const x509 = require('../saml/x509.js');
const dbutils = require('../db/utils.js');
const { indexNames } = require('./utils.js');

const crypto = require('crypto');

let configStore;

const extractHostName = (url) => {
  try {
    const pUrl = new URL(url);
    if(pUrl.hostname.startsWith('www.')) {
      return pUrl.hostname.substring(4);
    }
    return pUrl.hostname;
  } catch (err) {
    return null;
  }
};

const config = async (body) => {
  const { rawMetadata, defaultRedirectUrl, redirectUrl, tenant, product } =
    body;
  const idpMetadata = await saml.parseMetadataAsync(rawMetadata);

  // extract provider
  let providerName = extractHostName(idpMetadata.entityID);
  if (!providerName) {
    providerName = extractHostName(
      idpMetadata.sso.redirectUrl || idpMetadata.sso.postUrl
    );
  }

  idpMetadata.provider = providerName ? providerName : 'Unknown';

  let clientID = dbutils.keyDigest(
    dbutils.keyFromParts(tenant, product, idpMetadata.entityID)
  );
  let clientSecret;

  let exists = await configStore.get(clientID);
  if (exists) {
    clientSecret = exists.clientSecret;
  } else {
    clientSecret = crypto.randomBytes(24).toString('hex');
  }

  const certs = await x509.generate();
  if (!certs) {
    throw new Error('Error generating x59 certs');
  }

  await configStore.put(
    clientID,
    {
      idpMetadata,
      defaultRedirectUrl,
      redirectUrl: JSON.parse(redirectUrl),
      tenant,
      product,
      clientID,
      clientSecret,
      certs,
    },
    {
      // secondary index on entityID
      name: indexNames.entityID,
      value: idpMetadata.entityID,
    },
    {
      // secondary index on tenant + product
      name: indexNames.tenantProduct,
      value: dbutils.keyFromParts(tenant, product),
    }
  );

  return {
    client_id: clientID,
    client_secret: clientSecret,
    provider: idpMetadata.provider,
  };
};

const getConfig = async (body) => {
  const { clientID, clientSecret, tenant, product } = body;

  if (clientID && clientSecret) {
    const samlConfig = await configStore.get(clientID);
    if (!samlConfig) {
      return {};
    }

    return { provider: samlConfig.idpMetadata.provider };
  } else {
    const samlConfigs = await configStore.getByIndex({
      name: indexNames.tenantProduct,
      value: dbutils.keyFromParts(tenant, product),
    });
    if (!samlConfigs || !samlConfigs.length) {
      return {};
    }

    return { provider: samlConfigs[0].idpMetadata.provider };
  }
};

module.exports = (opts) => {
  configStore = opts.configStore;
  return {
    config,
    getConfig,
  };
};
