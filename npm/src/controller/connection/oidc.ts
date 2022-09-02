import crypto from 'crypto';
import { IConnectionAPIController, IdPConnection, Storable } from '../../typings';
import * as dbutils from '../../db/utils';
import {
  extractHostName,
  extractRedirectUrls,
  IndexNames,
  validateIdPConnection,
  validateRedirectUrl,
} from '../utils';
import { JacksonError } from '../error';

const oidc = {
  create: async (body: IdPConnection, connectionStore: Storable) => {
    const {
      defaultRedirectUrl,
      redirectUrl,
      tenant,
      product,
      name,
      description,
      oidcDiscoveryUrl = '',
      oidcClientId = '',
      oidcClientSecret = '',
    } = body;

    let configClientSecret;

    validateIdPConnection(body, 'oidc');
    const redirectUrlList = extractRedirectUrls(redirectUrl);
    validateRedirectUrl({ defaultRedirectUrl, redirectUrlList });

    const record: Partial<IdPConnection> & {
      clientID: string; // set by Jackson
      clientSecret: string; // set by Jackson
      oidcProvider?: {
        provider?: string;
        discoveryUrl?: string;
        clientId?: string;
        clientSecret?: string;
      };
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
    //  from OpenID Provider
    record.oidcProvider = {
      discoveryUrl: oidcDiscoveryUrl,
      clientId: oidcClientId,
      clientSecret: oidcClientSecret,
    };

    // extract provider
    const providerName = extractHostName(oidcDiscoveryUrl);
    record.oidcProvider.provider = providerName ? providerName : 'Unknown';

    // Use the clientId from the OpenID Provider to generate the clientID hash for the config
    record.clientID = dbutils.keyDigest(dbutils.keyFromParts(tenant, product, oidcClientId));

    const exists = await connectionStore.get(record.clientID);

    if (exists) {
      configClientSecret = exists.clientSecret;
    } else {
      configClientSecret = crypto.randomBytes(24).toString('hex');
    }

    record.clientSecret = configClientSecret;

    await connectionStore.put(record.clientID, record, {
      // secondary index on tenant + product
      name: IndexNames.TenantProduct,
      value: dbutils.keyFromParts(tenant, product),
    });

    return record;
  },
  update: async (
    body: IdPConnection & { clientID: string; clientSecret: string },
    connectionStore: Storable,
    configGetter: IConnectionAPIController['getConfig']
  ) => {
    const {
      defaultRedirectUrl,
      redirectUrl,
      name,
      description,
      oidcDiscoveryUrl,
      oidcClientId,
      oidcClientSecret,
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

    let oidcProvider;
    if (_currentConfig && typeof _currentConfig.oidcProvider === 'object') {
      oidcProvider = { ..._currentConfig.oidcProvider };
      if (oidcClientId && typeof oidcClientId === 'string') {
        const clientID = dbutils.keyDigest(
          dbutils.keyFromParts(clientInfo.tenant, clientInfo.product, oidcClientId)
        );
        if (clientID !== clientInfo?.clientID) {
          throw new JacksonError('Tenant/Product config mismatch with OIDC Provider metadata', 400);
        }
      }
      if (oidcClientSecret && typeof oidcClientSecret === 'string') {
        oidcProvider.clientSecret = oidcClientSecret;
      }
      if (oidcDiscoveryUrl && typeof oidcDiscoveryUrl === 'string') {
        oidcProvider.discoveryUrl = oidcDiscoveryUrl;
        const providerName = extractHostName(oidcDiscoveryUrl);
        oidcProvider.provider = providerName ? providerName : 'Unknown';
      }
    }

    const record = {
      ..._currentConfig,
      name: name ? name : _currentConfig.name,
      description: description ? description : _currentConfig.description,
      defaultRedirectUrl: defaultRedirectUrl ? defaultRedirectUrl : _currentConfig.defaultRedirectUrl,
      redirectUrl: redirectUrlList ? redirectUrlList : _currentConfig.redirectUrl,
      oidcProvider: oidcProvider ? oidcProvider : _currentConfig.oidcProvider,
    };

    await connectionStore.put(clientInfo?.clientID, record, {
      // secondary index on tenant + product
      name: IndexNames.TenantProduct,
      value: dbutils.keyFromParts(_currentConfig.tenant, _currentConfig.product),
    });
  },
};

export default oidc;
