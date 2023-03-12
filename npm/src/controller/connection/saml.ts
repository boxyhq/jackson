import crypto from 'crypto';
import {
  IConnectionAPIController,
  SAMLSSOConnectionWithEncodedMetadata,
  SAMLSSOConnectionWithRawMetadata,
  SAMLSSORecord,
  Storable,
} from '../../typings';
import * as dbutils from '../../db/utils';
import {
  extractHostName,
  extractRedirectUrls,
  IndexNames,
  validateSSOConnection,
  validateRedirectUrl,
  validateTenantAndProduct,
  isLocalhost,
} from '../utils';
import saml20 from '@boxyhq/saml20';
import { JacksonError } from '../error';
import axios from 'axios';

async function fetchMetadata(resource: string) {
  try {
    const response = await axios(resource, {
      maxContentLength: 1000000,
      maxBodyLength: 1000000,
      timeout: 8000,
    });
    return response.data;
  } catch (error: any) {
    throw new JacksonError("Couldn't fetch XML data", error.response?.status || 400);
  }
}

function validateParsedMetadata(metadata: SAMLSSORecord['idpMetadata']) {
  if (metadata.loginType !== 'idp') {
    throw new JacksonError('Please provide a metadata with IDPSSODescriptor', 400);
  }

  if (!metadata.entityID) {
    throw new JacksonError("Couldn't parse EntityID from SAML metadata", 400);
  }

  if (!metadata.sso.redirectUrl && !metadata.sso.postUrl) {
    throw new JacksonError("Couldn't find SAML bindings for POST/REDIRECT", 400);
  }
}

function validateMetadataURL(metadataUrl: string) {
  if (!isLocalhost(metadataUrl) && !metadataUrl.startsWith('https')) {
    throw new JacksonError('Metadata URL not valid, allowed ones are localhost/HTTPS URLs', 400);
  }
}

const saml = {
  create: async (
    body: SAMLSSOConnectionWithRawMetadata | SAMLSSOConnectionWithEncodedMetadata,
    connectionStore: Storable
  ) => {
    const {
      encodedRawMetadata,
      rawMetadata,
      defaultRedirectUrl,
      redirectUrl,
      tenant,
      product,
      name,
      description,
      metadataUrl,
      identifierFormat,
    } = body;
    const forceAuthn = body.forceAuthn == 'true' || body.forceAuthn == true;

    let connectionClientSecret: string;

    validateSSOConnection(body, 'saml');

    const redirectUrlList = extractRedirectUrls(redirectUrl);

    validateRedirectUrl({ defaultRedirectUrl, redirectUrlList });

    validateTenantAndProduct(tenant, product);

    const record: Partial<SAMLSSORecord> = {
      defaultRedirectUrl,
      redirectUrl: redirectUrlList,
      tenant,
      product,
      name,
      description,
      clientID: '',
      clientSecret: '',
      forceAuthn,
      identifierFormat,
      metadataUrl,
    };

    let metadata = rawMetadata as string;
    if (encodedRawMetadata) {
      metadata = Buffer.from(encodedRawMetadata, 'base64').toString();
    }

    metadataUrl && validateMetadataURL(metadataUrl);

    metadata = metadataUrl ? await fetchMetadata(metadataUrl) : metadata;

    const idpMetadata = (await saml20.parseMetadata(metadata, {})) as SAMLSSORecord['idpMetadata'];

    validateParsedMetadata(idpMetadata);

    // extract provider
    let providerName = extractHostName(idpMetadata.entityID);
    if (!providerName) {
      providerName = extractHostName(idpMetadata.sso.redirectUrl || idpMetadata.sso.postUrl || '');
    }

    idpMetadata.provider = providerName ? providerName : 'Unknown';

    record.clientID = dbutils.keyDigest(dbutils.keyFromParts(tenant, product, idpMetadata.entityID));

    record.idpMetadata = idpMetadata;

    const existing = await connectionStore.getByIndex({
      name: IndexNames.EntityID,
      value: idpMetadata.entityID,
    });

    if (existing.length > 0) {
      for (let i = 0; i < existing.length; i++) {
        const samlConfig = existing[i];
        if (samlConfig.tenant !== tenant && samlConfig.product === product) {
          throw new JacksonError('EntityID already exists for different tenant/product');
        } else if (samlConfig.tenant !== tenant && samlConfig.product !== product) {
          throw new JacksonError('EntityID already exists for different tenant/product');
        } else {
          continue;
        }
      }
    }

    const exists = await connectionStore.get(record.clientID);

    if (exists) {
      connectionClientSecret = exists.clientSecret;
    } else {
      connectionClientSecret = crypto.randomBytes(24).toString('hex');
    }

    record.clientSecret = connectionClientSecret;

    await connectionStore.put(
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

    return record as SAMLSSORecord;
  },

  update: async (
    body: (SAMLSSOConnectionWithRawMetadata | SAMLSSOConnectionWithEncodedMetadata) & {
      clientID: string;
      clientSecret: string;
    },
    connectionStore: Storable,
    connectionsGetter: IConnectionAPIController['getConnections']
  ) => {
    const {
      encodedRawMetadata, // could be empty
      rawMetadata, // could be empty
      defaultRedirectUrl,
      redirectUrl,
      name,
      description,
      forceAuthn = false,
      metadataUrl,
      identifierFormat,
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

    const _savedConnection = (await connectionsGetter(clientInfo))[0] as SAMLSSORecord;

    if (_savedConnection.clientSecret !== clientInfo?.clientSecret) {
      throw new JacksonError('clientSecret mismatch', 400);
    }

    let metadata = rawMetadata;
    if (encodedRawMetadata) {
      metadata = Buffer.from(encodedRawMetadata, 'base64').toString();
    }

    metadataUrl && validateMetadataURL(metadataUrl);

    metadata = metadataUrl ? await fetchMetadata(metadataUrl) : metadata;

    let newMetadata;
    if (metadata) {
      newMetadata = await saml20.parseMetadata(metadata, {});

      validateParsedMetadata(newMetadata);

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
      ..._savedConnection,
      name: name || name === '' ? name : _savedConnection.name,
      description: description || description === '' ? description : _savedConnection.description,
      idpMetadata: newMetadata ? newMetadata : _savedConnection.idpMetadata,
      defaultRedirectUrl: defaultRedirectUrl ? defaultRedirectUrl : _savedConnection.defaultRedirectUrl,
      redirectUrl: redirectUrlList ? redirectUrlList : _savedConnection.redirectUrl,
      forceAuthn,
      identifierFormat: identifierFormat || _savedConnection.identifierFormat,
    };

    await connectionStore.put(
      clientInfo?.clientID,
      record,
      {
        // secondary index on entityID
        name: IndexNames.EntityID,
        value: _savedConnection.idpMetadata.entityID,
      },
      {
        // secondary index on tenant + product
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(_savedConnection.tenant, _savedConnection.product),
      }
    );
  },
};

export default saml;
