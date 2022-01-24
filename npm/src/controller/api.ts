import crypto from 'crypto';
import { IdPConfig, IAPIController, OAuth, Storable } from '../typings';
import * as dbutils from '../db/utils';
import saml from '../saml/saml';
import x509 from '../saml/x509';
import { JacksonError } from './error';
import { IndexNames } from './utils';

export class APIController implements IAPIController {
  private configStore: Storable;

  constructor({ configStore }) {
    this.configStore = configStore;
  }

  private _validateIdPConfig(body: IdPConfig): void {
    const { encodedRawMetadata, rawMetadata, defaultRedirectUrl, redirectUrl, tenant, product, name } = body;

    if (!rawMetadata && !encodedRawMetadata) {
      throw new JacksonError('Please provide rawMetadata or encodedRawMetadata', 400);
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

    if (!name) {
      throw new JacksonError('Please provide a friendly name', 400);
    }
  }

  public async config(body: IdPConfig): Promise<OAuth> {
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

    this._validateIdPConfig(body);

    let metaData = rawMetadata;
    if (encodedRawMetadata) {
      metaData = Buffer.from(encodedRawMetadata, 'base64').toString();
    }

    const idpMetadata = await saml.parseMetadataAsync(metaData!);

    // extract provider
    let providerName = extractHostName(idpMetadata.entityID);
    if (!providerName) {
      providerName = extractHostName(idpMetadata.sso.redirectUrl || idpMetadata.sso.postUrl);
    }

    idpMetadata.provider = providerName ? providerName : 'Unknown';

    const clientID = dbutils.keyDigest(dbutils.keyFromParts(tenant, product, idpMetadata.entityID));

    let clientSecret;

    const exists = await this.configStore.get(clientID);

    if (exists) {
      clientSecret = exists.clientSecret;
    } else {
      clientSecret = crypto.randomBytes(24).toString('hex');
    }

    const certs = await x509.generate();

    if (!certs) {
      throw new Error('Error generating x59 certs');
    }

    await this.configStore.put(
      clientID,
      {
        idpMetadata,
        defaultRedirectUrl,
        redirectUrl: JSON.parse(redirectUrl), // redirectUrl is a stringified array
        tenant,
        product,
        name,
        description,
        clientID,
        clientSecret,
        certs,
      },
      {
        // secondary index on entityID
        name: IndexNames.EntityID,
        value: idpMetadata.entityID,
      },
      {
        // secondary index on tenant + product
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      }
    );

    return {
      client_id: clientID,
      client_secret: clientSecret,
      provider: idpMetadata.provider,
    };
  }

  public async updateConfig(body): Promise<void> {
    const {
      encodedRawMetadata, // could be omitted
      rawMetadata, // could be omitted
      defaultRedirectUrl,
      redirectUrl,
      name,
      description,
      ...clientInfo
    } = body;
    if (!clientInfo?.clientID) {
      throw new JacksonError('Please provide clientID', 400);
    }
    let metaData = rawMetadata;
    if (encodedRawMetadata) {
      metaData = Buffer.from(encodedRawMetadata, 'base64').toString();
    }
    let newMetadata;
    if (metaData) {
      newMetadata = await saml.parseMetadataAsync(metaData);

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
        throw new JacksonError('Tenant/Product config mismatch with IdP metadata');
      }
    }
    const _currentConfig = (await this.getConfig(clientInfo))?.config;

    await this.configStore.put(
      clientInfo?.clientID,
      {
        ..._currentConfig,
        name: name ? name : _currentConfig.name,
        description: description ? description : _currentConfig.description,
        idpMetadata: newMetadata ? newMetadata : _currentConfig.idpMetadata,
        defaultRedirectUrl: defaultRedirectUrl ? defaultRedirectUrl : _currentConfig.defaultRedirectUrl,
        redirectUrl: redirectUrl ? JSON.parse(redirectUrl) : _currentConfig.redirectUrl,
      },
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
  }

  public async getConfig(body: { clientID: string; tenant: string; product: string }): Promise<any> {
    const { clientID, tenant, product } = body;

    if (clientID) {
      const samlConfig = await this.configStore.get(clientID);

      return samlConfig ? { config: samlConfig } : {};
    }

    if (tenant && product) {
      const samlConfigs = await this.configStore.getByIndex({
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      });

      if (!samlConfigs || !samlConfigs.length) {
        return {};
      }

      return { config: samlConfigs[0] };
    }

    throw new JacksonError('Please provide `clientID` or `tenant` and `product`.', 400);
  }

  public async deleteConfig(body: {
    clientID: string;
    clientSecret: string;
    tenant: string;
    product: string;
  }): Promise<void> {
    const { clientID, clientSecret, tenant, product } = body;

    if (clientID && clientSecret) {
      const samlConfig = await this.configStore.get(clientID);

      if (!samlConfig) {
        return;
      }

      if (samlConfig.clientSecret === clientSecret) {
        await this.configStore.delete(clientID);
      } else {
        throw new JacksonError('clientSecret mismatch.', 400);
      }

      return;
    }

    if (tenant && product) {
      const samlConfigs = await this.configStore.getByIndex({
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      });

      if (!samlConfigs || !samlConfigs.length) {
        return;
      }

      for (const conf of samlConfigs) {
        await this.configStore.delete(conf.clientID);
      }

      return;
    }

    throw new JacksonError('Please provide `clientID` and `clientSecret` or `tenant` and `product`.', 400);
  }
}

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
