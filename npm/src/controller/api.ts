import crypto from 'crypto';
import * as dbutils from '../db/utils';
import * as metrics from '../opentelemetry/metrics';

import { parseMetadataAsync } from '@boxyhq/saml20';
import x509 from '../saml/x509';
import { IAPIController, IdPConfig, Storable } from '../typings';
import { JacksonError } from './error';
import { IndexNames, validateAbsoluteUrl } from './utils';

export class APIController implements IAPIController {
  private configStore: Storable;

  constructor({ configStore }) {
    this.configStore = configStore;
  }

  private _validateRedirectUrl({ redirectUrlList, defaultRedirectUrl }) {
    if (redirectUrlList) {
      if (redirectUrlList.length > 100) {
        throw new JacksonError('Exceeded maximum number of allowed redirect urls', 400);
      }
      for (const url of redirectUrlList) {
        validateAbsoluteUrl(url, 'redirectUrl is invalid');
      }
    }
    if (defaultRedirectUrl) {
      validateAbsoluteUrl(defaultRedirectUrl, 'defaultRedirectUrl is invalid');
    }
  }

  private _validateIdPConfig(body: IdPConfig): void {
    const { encodedRawMetadata, rawMetadata, defaultRedirectUrl, redirectUrl, tenant, product, description } =
      body;

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

    if (description && description.length > 100) {
      throw new JacksonError('Description should not exceed 100 characters', 400);
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
   *       - name: name
   *         description: Name/identifier for the config
   *         type: string
   *         in: formData
   *       - name: description
   *         description: A short description for the config not more than 100 characters
   *         type: string
   *         in: formData
   *       - name: encodedRawMetadata
   *         description: Base64 encoding of the XML metadata
   *         in: formData
   *         type: string
   *       - name: rawMetadata
   *         description: Raw XML metadata
   *         in: formData
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
   *           example:
   *             {
   *               "idpMetadata": {
   *                 "sso": {
   *                   "postUrl": "https://dev-20901260.okta.com/app/dev-20901260_jacksonnext_1/xxxxxxxxxxxxx/sso/saml",
   *                   "redirectUrl": "https://dev-20901260.okta.com/app/dev-20901260_jacksonnext_1/xxxxxxxxxxxxx/sso/saml"
   *                 },
   *                 "entityID": "http://www.okta.com/xxxxxxxxxxxxx",
   *                 "thumbprint": "Eo+eUi3UM3XIMkFFtdVK3yJ5vO9f7YZdasdasdad",
   *                 "loginType": "idp",
   *                 "provider": "okta.com"
   *               },
   *               "defaultRedirectUrl": "https://hoppscotch.io/",
   *               "redirectUrl": ["https://hoppscotch.io/"],
   *               "tenant": "hoppscotch.io",
   *               "product": "API Engine",
   *               "name": "Hoppscotch-SP",
   *               "description": "SP for hoppscotch.io",
   *               "clientID": "Xq8AJt3yYAxmXizsCWmUBDRiVP1iTC8Y/otnvFIMitk",
   *               "clientSecret": "00e3e11a3426f97d8000000738300009130cd45419c5943",
   *               "certs": {
   *                 "publicKey": "-----BEGIN CERTIFICATE-----.......-----END CERTIFICATE-----",
   *                 "privateKey": "-----BEGIN PRIVATE KEY-----......-----END PRIVATE KEY-----"
   *               }
   *           }
   *       400:
   *         description: Please provide rawMetadata or encodedRawMetadata | Please provide a defaultRedirectUrl | Please provide redirectUrl | Please provide tenant | Please provide product | Please provide a friendly name | Description should not exceed 100 characters
   *       401:
   *         description: Unauthorized
   */
  public async config(body: IdPConfig): Promise<any> {
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

    metrics.increment('createConfig');

    this._validateIdPConfig(body);
    const redirectUrlList = extractRedirectUrls(redirectUrl);
    this._validateRedirectUrl({ defaultRedirectUrl, redirectUrlList });

    let metaData = rawMetadata;
    if (encodedRawMetadata) {
      metaData = Buffer.from(encodedRawMetadata, 'base64').toString();
    }

    const idpMetadata = await parseMetadataAsync(metaData!);

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

    const record = {
      idpMetadata,
      defaultRedirectUrl,
      redirectUrl: redirectUrlList,
      tenant,
      product,
      name,
      description,
      clientID,
      clientSecret,
      certs,
    };

    await this.configStore.put(
      clientID,
      record,
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

    return record;
  }
  /**
   * @swagger
   *
   * /api/v1/saml/config:
   *   patch:
   *     summary: Update SAML configuration
   *     operationId: update-saml-config
   *     tags: [SAML Config]
   *     consumes:
   *       - application/json
   *       - application/x-www-form-urlencoded
   *     parameters:
   *       - name: clientID
   *         description: Client ID for the config
   *         type: string
   *         in: formData
   *         required: true
   *       - name: clientSecret
   *         description: Client Secret for the config
   *         type: string
   *         in: formData
   *         required: true
   *       - name: name
   *         description: Name/identifier for the config
   *         type: string
   *         in: formData
   *       - name: description
   *         description: A short description for the config not more than 100 characters
   *         type: string
   *         in: formData
   *       - name: encodedRawMetadata
   *         description: Base64 encoding of the XML metadata
   *         in: formData
   *         type: string
   *       - name: rawMetadata
   *         description: Raw XML metadata
   *         in: formData
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
   *       204:
   *         description: Success
   *       400:
   *         description: Please provide clientID | Please provide clientSecret | clientSecret mismatch | Tenant/Product config mismatch with IdP metadata | Description should not exceed 100 characters
   *       401:
   *         description: Unauthorized
   */
  public async updateConfig(body): Promise<void> {
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
    if (description && description.length > 100) {
      throw new JacksonError('Description should not exceed 100 characters', 400);
    }
    const redirectUrlList = redirectUrl ? extractRedirectUrls(redirectUrl) : null;
    this._validateRedirectUrl({ defaultRedirectUrl, redirectUrlList });

    const _currentConfig = await this.getConfig(clientInfo);

    if (_currentConfig.clientSecret !== clientInfo?.clientSecret) {
      throw new JacksonError('clientSecret mismatch', 400);
    }
    let metaData = rawMetadata;
    if (encodedRawMetadata) {
      metaData = Buffer.from(encodedRawMetadata, 'base64').toString();
    }
    let newMetadata;
    if (metaData) {
      newMetadata = await parseMetadataAsync(metaData);

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

    await this.configStore.put(
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
   *           example:
   *             {
   *               "idpMetadata": {
   *                 "sso": {
   *                   "postUrl": "https://dev-20901260.okta.com/app/dev-20901260_jacksonnext_1/xxxxxxxxxxxxx/sso/saml",
   *                   "redirectUrl": "https://dev-20901260.okta.com/app/dev-20901260_jacksonnext_1/xxxxxxxxxxxxx/sso/saml"
   *                 },
   *                 "entityID": "http://www.okta.com/xxxxxxxxxxxxx",
   *                 "thumbprint": "Eo+eUi3UM3XIMkFFtdVK3yJ5vO9f7YZdasdasdad",
   *                 "loginType": "idp",
   *                 "provider": "okta.com"
   *               },
   *               "defaultRedirectUrl": "https://hoppscotch.io/",
   *               "redirectUrl": ["https://hoppscotch.io/"],
   *               "tenant": "hoppscotch.io",
   *               "product": "API Engine",
   *               "name": "Hoppscotch-SP",
   *               "description": "SP for hoppscotch.io",
   *               "clientID": "Xq8AJt3yYAxmXizsCWmUBDRiVP1iTC8Y/otnvFIMitk",
   *               "clientSecret": "00e3e11a3426f97d8000000738300009130cd45419c5943",
   *               "certs": {
   *                 "publicKey": "-----BEGIN CERTIFICATE-----.......-----END CERTIFICATE-----",
   *                 "privateKey": "-----BEGIN PRIVATE KEY-----......-----END PRIVATE KEY-----"
   *               }
   *           }
   *       '400':
   *         description: Please provide `clientID` or `tenant` and `product`.
   *       '401':
   *         description: Unauthorized
   */
  public async getConfig(body: { clientID: string; tenant: string; product: string }): Promise<any> {
    const { clientID, tenant, product } = body;

    metrics.increment('getConfig');

    if (clientID) {
      const samlConfig = await this.configStore.get(clientID);

      return samlConfig || {};
    }

    if (tenant && product) {
      const samlConfigs = await this.configStore.getByIndex({
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      });

      if (!samlConfigs || !samlConfigs.length) {
        return {};
      }

      return { ...samlConfigs[0] };
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
   *       '400':
   *         description: clientSecret mismatch | Please provide `clientID` and `clientSecret` or `tenant` and `product`.'
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
        throw new JacksonError('clientSecret mismatch', 400);
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

const extractRedirectUrls = (urls: string[] | string): string[] => {
  if (!urls) {
    return [];
  }

  if (typeof urls === 'string') {
    if (urls.startsWith('[')) {
      // redirectUrl is a stringified array
      return JSON.parse(urls);
    }
    // redirectUrl is a single URL
    return [urls];
  }

  // redirectUrl is an array of URLs
  return urls;
};
