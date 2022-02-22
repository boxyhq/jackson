import crypto from 'crypto';
import * as dbutils from '../db/utils';
import * as metrics from '../opentelemetry/metrics';
import saml from '../saml/saml';
import x509 from '../saml/x509';
import { IAPIController, IdPConfig, OAuth, Storable } from '../typings';
import { JacksonError } from './error';
import { IndexNames } from './utils';

export class APIController implements IAPIController {
  private configStore: Storable;

  constructor({ configStore }) {
    this.configStore = configStore;
  }

  private _validateIdPConfig(body: IdPConfig): void {
    const { encodedRawMetadata, rawMetadata, defaultRedirectUrl, redirectUrl, tenant, product } = body;

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
  }

  /**
   * @swagger
   *
   * /api/v1/saml/config:
   *   post:
   *     summary: Create SAML configuration
   *     operationId: create-saml-config
   *     tags: [SAML Config]
   *     produces:
   *       - application/json
   *     consumes:
   *       - application/x-www-form-urlencoded
   *     parameters:
   *       - name: encodedRawMetadata
   *         description: Base64 encoding of the XML metadata
   *         in: formData
   *         required: true
   *         type: string
   *       - name: defaultRedirectUrl
   *         description: The redirect URL to use in the IdP login flow
   *         in: formData
   *         required: true
   *         type: string
   *       - name: redirectUrl
   *         description: JSON encoded array containing a list of allowed redirect URLs
   *         in: formData
   *         required: true
   *         type: string
   *       - name: tenant
   *         description: Tenant
   *         in: formData
   *         required: true
   *         type: string
   *       - name: product
   *         description: Product
   *         in: formData
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: Success
   *         schema:
   *           type: object
   *           properties:
   *             client_id:
   *               type: string
   *             client_secret:
   *               type: string
   *             provider:
   *               type: string
   *           example:
   *             client_id: 8958e13053832b5af58fdf2ee83f35f5d013dc74
   *             client_secret: 13f01f4df5b01770c616e682d14d3ba23f20948cfa89b1d7
   *             type: accounts.google.com
   *       401:
   *         description: Unauthorized
   */
  public async config(body: IdPConfig): Promise<OAuth> {
    const { encodedRawMetadata, rawMetadata, defaultRedirectUrl, redirectUrl, tenant, product } = body;

    metrics.increment('createConfig');

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

  /**
   * @swagger
   *
   * /api/v1/saml/config:
   *   get:
   *     summary: Get SAML configuration
   *     operationId: get-saml-config
   *     tags:
   *       - SAML Config
   *     parameters:
   *       - in: query
   *         name: tenant
   *         type: string
   *         description: Tenant
   *       - in: query
   *         name: product
   *         type: string
   *         description: Product
   *       - in: query
   *         name: clientID
   *         type: string
   *         description: Client ID
   *     responses:
   *       '200':
   *         description: Success
   *         schema:
   *           type: object
   *           properties:
   *             provider:
   *               type: string
   *           example:
   *             type: accounts.google.com
   *       '401':
   *         description: Unauthorized
   */
  public async getConfig(body: {
    clientID: string;
    tenant: string;
    product: string;
  }): Promise<Partial<OAuth>> {
    const { clientID, tenant, product } = body;

    metrics.increment('getConfig');

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

    throw new JacksonError('Please provide `clientID` or `tenant` and `product`.', 400);
  }

  /**
   * @swagger
   * /api/v1/saml/config:
   *   delete:
   *     summary: Delete SAML configuration
   *     operationId: delete-saml-config
   *     tags:
   *       - SAML Config
   *     consumes:
   *       - application/x-www-form-urlencoded
   *     parameters:
   *       - name: clientID
   *         in: formData
   *         type: string
   *         required: true
   *         description: Client ID
   *       - name: clientSecret
   *         in: formData
   *         type: string
   *         required: true
   *         description: Client Secret
   *       - name: tenant
   *         in: formData
   *         type: string
   *         description: Tenant
   *       - name: product
   *         in: formData
   *         type: string
   *         description: Product
   *     responses:
   *       '200':
   *         description: Success
   *       '401':
   *         description: Unauthorized
   */
  public async deleteConfig(body: {
    clientID: string;
    clientSecret: string;
    tenant: string;
    product: string;
  }): Promise<void> {
    const { clientID, clientSecret, tenant, product } = body;

    metrics.increment('deleteConfig');

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
