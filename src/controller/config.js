const saml = require('../saml/saml.js');
const x509 = require('../saml/x509.js');
const dbutils = require('../db/utils.js');
const { indexNames } = require('./utils.js');

const crypto = require('crypto');

let configStore;

const config = async (body) => {
  const { rawMetadata, defaultRedirectUrl, redirectUrl, tenant, product } =
    body;
  const idpMetadata = await saml.parseMetadataAsync(rawMetadata);

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
  };
};

module.exports = (opts) => {
  configStore = opts.configStore;
  return config;
};
