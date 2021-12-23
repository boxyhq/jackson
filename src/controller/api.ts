import * as crypto from 'crypto';
import { Client, IABC, IdPConfig } from "../typings";

const saml = require('../saml/saml.js');
const x509 = require('../saml/x509.js');
const dbutils = require('../db/utils.js');
const { indexNames } = require('./utils.js');
const { JacksonError } = require('./error.js');

let configStore;

const extractHostName = (url: string): string | null => {
  try {
    const pUrl = new URL(url);

    if (pUrl.hostname.startsWith('www.')) {
      return pUrl.hostname.substring(4);
    }

    return pUrl.hostname;
  } catch (err) {
    return null;
  }
};

const validateIdPConfig = (body: IdPConfig): void => {
    const { rawMetadata, defaultRedirectUrl, redirectUrl, tenant, product } = body;

    if (!rawMetadata) {
        throw new JacksonError('Please provide rawMetadata', 400);
    }

    if (!defaultRedirectUrl) {
        throw new JacksonError('Please provide a defaultRedirectUrl', 400);
    }

    if (!redirectUrl) {
        throw new JacksonError('Please provide redirectUrl', 400);
    }

    if (!tenant) {
        throw new JacksonError('Please provide tenant', 400);
    }

    if (!product) {
        throw new JacksonError('Please provide product', 400);
    }
}

const config = async (body: IdPConfig): Promise<Client> => {
  const { rawMetadata, defaultRedirectUrl, redirectUrl, tenant, product } = body;

  validateIdPConfig(body)

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
      redirectUrl: JSON.parse(redirectUrl), // redirectUrl is a stringified array
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

const getConfig = async (body: IABC): Promise<Partial<Client>> => {
  const { clientID, tenant, product } = body;

  // TODO: Add params validations

  if (clientID) {
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

const deleteConfig = async (body: IABC): Promise<void> => {
  const { clientID, clientSecret, tenant, product } = body;

   // TODO: Add params validations

  if (clientID) {
    if (!clientSecret) {
      throw new JacksonError('Please provide clientSecret', 400);
    }
    const samlConfig = await configStore.get(clientID);
    if (!samlConfig) {
      return;
    }
    if (samlConfig.clientSecret === clientSecret) {
      await configStore.delete(clientID);
    } else {
      throw new JacksonError('clientSecret mismatch', 400);
    }
  } else {
    const samlConfigs = await configStore.getByIndex({
      name: indexNames.tenantProduct,
      value: dbutils.keyFromParts(tenant, product),
    });
    if (!samlConfigs || !samlConfigs.length) {
      return;
    }
    for (const conf of samlConfigs) {
      await configStore.delete(conf.clientID);
    }
  }
};

export default (opts) => {
  configStore = opts.configStore;

  return {
    config,
    getConfig,
    deleteConfig,
  };
}