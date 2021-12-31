import crypto from 'crypto';
import { IdPConfig, ISAMLConfig, OAuth, Storable } from 'saml-jackson';
import * as dbutils from '../db/utils';
import saml from '../saml/saml';
import x509 from '../saml/x509';
import { JacksonError } from './error';
import { IndexNames } from './utils';

export class SAMLConfig implements ISAMLConfig {
  private configStore: Storable;

  constructor({ configStore }) {
    this.configStore = configStore;
  }

  private _validateIdPConfig(body: IdPConfig): void {
    const { rawMetadata, defaultRedirectUrl, redirectUrl, tenant, product } =
      body;

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

  public async create(body: IdPConfig): Promise<OAuth> {
    const { rawMetadata, defaultRedirectUrl, redirectUrl, tenant, product } =
      body;

    this._validateIdPConfig(body);

    const idpMetadata = await saml.parseMetadataAsync(rawMetadata);

    // extract provider
    let providerName = extractHostName(idpMetadata.entityID);
    if (!providerName) {
      providerName = extractHostName(
        idpMetadata.sso.redirectUrl || idpMetadata.sso.postUrl
      );
    }

    idpMetadata.provider = providerName ? providerName : 'Unknown';

    const clientID = dbutils.keyDigest(
      dbutils.keyFromParts(tenant, product, idpMetadata.entityID)
    );

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

  public async get(body: {
    clientID: string;
    tenant: string;
    product: string;
  }): Promise<Partial<OAuth>> {
    const { clientID, tenant, product } = body;

    if (clientID) {
      const samlConfig = await this.configStore.get(clientID);

      return samlConfig ? { provider: samlConfig.idpMetadata.provider } : {};
    }

    if (tenant && product) {
      const samlConfigs = await this.configStore.getByIndex({
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      });

      if (!samlConfigs || !samlConfigs.length) {
        return {};
      }

      return { provider: samlConfigs[0].idpMetadata.provider };
    }

    throw new JacksonError(
      'Please provide `clientID` or `tenant` and `product`.',
      400
    );
  }

  public async delete(body: {
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

    throw new JacksonError(
      'Please provide `clientID` and `clientSecret` or `tenant` and `product`.',
      400
    );
  }

  // Ensure backward compatibility

  async config(body: IdPConfig): Promise<OAuth> {
    return this.create(body);
  }

  async getConfig(body: {
    clientID: string;
    tenant: string;
    product: string;
  }): Promise<Partial<OAuth>> {
    return this.get(body);
  }

  async deleteConfig(body: {
    clientID: string;
    clientSecret: string;
    tenant: string;
    product: string;
  }): Promise<void> {
    return this.delete(body);
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
