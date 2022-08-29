import crypto from 'crypto';
import { IConfigAPIController, IdPConfig, Storable } from '../../typings';
import * as dbutils from '../../db/utils';
import {
  extractHostName,
  extractRedirectUrls,
  IndexNames,
  validateIdPConfig,
  validateRedirectUrl,
} from '../utils';
import saml20 from '@boxyhq/saml20';
import x509 from '../../saml/x509';
import { JacksonError } from '../error';

const saml = {
  create: async (body: IdPConfig, configStore: Storable) => {
    const {
      encodedRawMetadata,
      rawMetadata,
      defaultRedirectUrl,
      redirectUrl,
      tenant,
      product,
      name,
      description,
    } = body;

    let configClientSecret;

    validateIdPConfig(body, 'saml');
    const redirectUrlList = extractRedirectUrls(redirectUrl);
    validateRedirectUrl({ defaultRedirectUrl, redirectUrlList });

    const record: Partial<IdPConfig> & {
      clientID: string; // set by Jackson
      clientSecret: string; // set by Jackson
      idpMetadata?: Record<string, any>;
      certs?: Record<'publicKey' | 'privateKey', string>;
    } = {
      defaultRedirectUrl,
      redirectUrl: redirectUrlList,
      tenant,
      product,
      name,
      description,
      clientID: '',
      clientSecret: '',
    };

    let metaData = rawMetadata;
    if (encodedRawMetadata) {
      metaData = Buffer.from(encodedRawMetadata, 'base64').toString();
    }

    const idpMetadata = await saml20.parseMetadata(metaData!, {});

    // extract provider
    let providerName = extractHostName(idpMetadata.entityID);
    if (!providerName) {
      providerName = extractHostName(idpMetadata.sso.redirectUrl || idpMetadata.sso.postUrl);
    }

    idpMetadata.provider = providerName ? providerName : 'Unknown';

    record.clientID = dbutils.keyDigest(dbutils.keyFromParts(tenant, product, idpMetadata.entityID));

    const certs = await x509.generate();

    if (!certs) {
      throw new Error('Error generating x59 certs');
    }

    record.idpMetadata = idpMetadata;
    record.certs = certs;

    const exists = await configStore.get(record.clientID);

    if (exists) {
      configClientSecret = exists.clientSecret;
    } else {
      configClientSecret = crypto.randomBytes(24).toString('hex');
    }

    record.clientSecret = configClientSecret;

    await configStore.put(
      record.clientID,
      record,
      {
        name: IndexNames.EntityID, // secondary index on entityID
        value: idpMetadata.entityID,
      },
      {
        // secondary index on tenant + product
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      }
    );

    return record;
  },
  update: async (
    body: IdPConfig & { clientID: string; clientSecret: string },
    configStore: Storable,
    configGetter: IConfigAPIController['getConfig']
  ) => {
    const {
      encodedRawMetadata, // could be empty
      rawMetadata, // could be empty
      defaultRedirectUrl,
      redirectUrl,
      name,
      description,
      ...clientInfo
    } = body;
    if (!clientInfo?.clientID) {
      throw new JacksonError('Please provide clientID', 400);
    }
    if (!clientInfo?.clientSecret) {
      throw new JacksonError('Please provide clientSecret', 400);
    }
    if (!clientInfo?.tenant) {
      throw new JacksonError('Please provide tenant', 400);
    }
    if (!clientInfo?.product) {
      throw new JacksonError('Please provide product', 400);
    }
    if (description && description.length > 100) {
      throw new JacksonError('Description should not exceed 100 characters', 400);
    }
    const redirectUrlList = redirectUrl ? extractRedirectUrls(redirectUrl) : null;
    validateRedirectUrl({ defaultRedirectUrl, redirectUrlList });

    const _currentConfig = await configGetter(clientInfo);

    if (_currentConfig.clientSecret !== clientInfo?.clientSecret) {
      throw new JacksonError('clientSecret mismatch', 400);
    }

    let metaData = rawMetadata;
    if (encodedRawMetadata) {
      metaData = Buffer.from(encodedRawMetadata, 'base64').toString();
    }
    let newMetadata;
    if (metaData) {
      newMetadata = await saml20.parseMetadata(metaData, {});

      // extract provider
      let providerName = extractHostName(newMetadata.entityID);
      if (!providerName) {
        providerName = extractHostName(newMetadata.sso.redirectUrl || newMetadata.sso.postUrl);
      }

      newMetadata.provider = providerName ? providerName : 'Unknown';
    }

    if (newMetadata) {
      // check if clientID matches with new metadata payload
      const clientID = dbutils.keyDigest(
        dbutils.keyFromParts(clientInfo.tenant, clientInfo.product, newMetadata.entityID)
      );

      if (clientID !== clientInfo?.clientID) {
        throw new JacksonError('Tenant/Product config mismatch with IdP metadata', 400);
      }
    }

    const record = {
      ..._currentConfig,
      name: name ? name : _currentConfig.name,
      description: description ? description : _currentConfig.description,
      idpMetadata: newMetadata ? newMetadata : _currentConfig.idpMetadata,
      defaultRedirectUrl: defaultRedirectUrl ? defaultRedirectUrl : _currentConfig.defaultRedirectUrl,
      redirectUrl: redirectUrlList ? redirectUrlList : _currentConfig.redirectUrl,
    };

    await configStore.put(
      clientInfo?.clientID,
      record,
      {
        // secondary index on entityID
        name: IndexNames.EntityID,
        value: _currentConfig.idpMetadata.entityID,
      },
      {
        // secondary index on tenant + product
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(_currentConfig.tenant, _currentConfig.product),
      }
    );
  },
};

export default saml;
