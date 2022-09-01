import * as dbutils from '../db/utils';
import * as metrics from '../opentelemetry/metrics';
import { IConnectionAPIController, IdPConnection, Storable } from '../typings';
import { JacksonError } from './error';
import { IndexNames } from './utils';
import oidcConnection from './connection/oidc';
import samlConnection from './connection/saml';

export class ConnectionAPIController implements IConnectionAPIController {
  private configStore: Storable;

  constructor({ configStore }) {
    this.configStore = configStore;
  }

  /**
   * @swagger
   * /api/v1/saml/connection:
   *   $ref: '#/paths/~1api~1v1~1saml~1config'
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
   *         description: Please provide rawMetadata or encodedRawMetadata | Please provide a defaultRedirectUrl | Please provide redirectUrl | redirectUrl is invalid | Exceeded maximum number of allowed redirect urls | defaultRedirectUrl is invalid | Please provide tenant | Please provide product | Please provide a friendly name | Description should not exceed 100 characters | Strategy&#58; xxxx not supported
   *       401:
   *         description: Unauthorized
   */
  public async createSAMLConnection(body: IdPConnection): Promise<any> {
    metrics.increment('createConfig');
    const record = await samlConnection.create(body, this.configStore);
    return record;
  }
  // For backwards compatibility
  public async config(...args: Parameters<ConnectionAPIController['createSAMLConnection']>): Promise<any> {
    return this.createSAMLConnection(...args);
  }

  /**
   * @swagger
   * /api/v1/oidc/connection:
   *   post:
   *     summary: Create OIDC configuration
   *     operationId: create-oidc-config
   *     tags: [OIDC Connection]
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
   *       - name: oidcDiscoveryUrl
   *         description: well-known URL where the OpenID Provider configuration is exposed
   *         in: formData
   *         required: true
   *         type: string
   *       - name: oidcClientId
   *         description: clientId of the application set up on the OpenID Provider
   *         in: formData
   *         required: true
   *         type: string
   *       - name: oidcClientSecret
   *         description: clientSecret of the application set up on the OpenID Provider
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
   *           example:
   *             {
   *               "oidcProvider": {
   *                 "discoveryUrl": "https://dev-xxxxx.okta.com/oauth2/yyyyyy/.well-known/openid-configuration",
   *                 "clientId": "xxxxxxyyyyyyxxxxxx",
   *                 "clientSecret": "zzzzzzzzzzzzzzzz"
   *                },
   *               "defaultRedirectUrl": "https://hoppscotch.io/",
   *               "redirectUrl": ["https://hoppscotch.io/"],
   *               "tenant": "hoppscotch.io",
   *               "product": "API Engine",
   *               "name": "Hoppscotch-SP",
   *               "description": "SP for hoppscotch.io",
   *               "clientID": "Xq8AJt3yYAxmXizsCWmUBDRiVP1iTC8Y/otnvFIMitk",
   *               "clientSecret": "00e3e11a3426f97d8000000738300009130cd45419c5943",
   *           }
   *       400:
   *         description: Please provide a defaultRedirectUrl | Please provide redirectUrl | redirectUrl is invalid | Exceeded maximum number of allowed redirect urls | defaultRedirectUrl is invalid | Please provide tenant | Please provide product | Please provide a friendly name | Description should not exceed 100 characters | Please provide the clientId from OpenID Provider | Please provide the clientSecret from OpenID Provider | Please provide the discoveryUrl for the OpenID Provider
   *       401:
   *         description: Unauthorized
   */
  public async createOIDCConnection(body: IdPConnection): Promise<any> {
    metrics.increment('createConfig');
    const record = await oidcConnection.create(body, this.configStore);
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
   *         type: string
   *       - name: redirectUrl
   *         description: JSON encoded array containing a list of allowed redirect URLs
   *         in: formData
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
   *         description: Please provide clientID | Please provide clientSecret | clientSecret mismatch | Tenant/Product config mismatch with IdP metadata | Description should not exceed 100 characters| redirectUrl is invalid | Exceeded maximum number of allowed redirect urls | defaultRedirectUrl is invalid
   *       401:
   *         description: Unauthorized
   */
  public async updateSAMLConfig(
    body: IdPConnection & { clientID: string; clientSecret: string }
  ): Promise<void> {
    await samlConnection.update(body, this.configStore, this.getConfig.bind(this));
  }

  // For backwards compatibility
  public async updateConfig(...args: Parameters<ConnectionAPIController['updateSAMLConfig']>): Promise<any> {
    await this.updateSAMLConfig(...args);
  }
  /**
   * @swagger
   * /api/v1/oidc/connection:
   *   patch:
   *     summary: Update OIDC configuration
   *     operationId: update-oidc-config
   *     tags: [OIDC Connection]
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
   *       - name: oidcDiscoveryUrl
   *         description: well-known URL where the OpenID Provider configuration is exposed
   *         in: formData
   *         type: string
   *       - name: oidcClientId
   *         description: clientId of the application set up on the OpenID Provider
   *         in: formData
   *         type: string
   *       - name: oidcClientSecret
   *         description: clientSecret of the application set up on the OpenID Provider
   *         in: formData
   *         type: string
   *       - name: defaultRedirectUrl
   *         description: The redirect URL to use in the IdP login flow
   *         in: formData
   *         type: string
   *       - name: redirectUrl
   *         description: JSON encoded array containing a list of allowed redirect URLs
   *         in: formData
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
   *         description: Please provide clientID | Please provide clientSecret | clientSecret mismatch | Description should not exceed 100 characters | redirectUrl is invalid | Please provide tenant | Please provide product | Exceeded maximum number of allowed redirect urls | defaultRedirectUrl is invalid | Tenant/Product config mismatch with OIDC Provider metadata
   *       401:
   *         description: Unauthorized
   */
  public async updateOIDCConfig(
    body: IdPConnection & { clientID: string; clientSecret: string }
  ): Promise<void> {
    await oidcConnection.update(body, this.configStore, this.getConfig.bind(this));
  }
  /**
   * @swagger
   * parameters:
   *  tenantParam:
   *     in: query
   *     name: tenant
   *     type: string
   *     description: Tenant
   *  productParam:
   *     in: query
   *     name: product
   *     type: string
   *     description: Product
   *  clientIDParam:
   *     in: query
   *     name: clientID
   *     type: string
   *     description: Client ID
   * /api/v1/oidc/connection:
   *   get:
   *     summary: Get OIDC Connection
   *     parameters:
   *       - $ref: '#/parameters/tenantParam'
   *       - $ref: '#/parameters/productParam'
   *       - $ref: '#/parameters/clientIDParam'
   *     operationId: get-oidc-connection
   *     tags: [OIDC Connection]
   * /api/v1/saml/config:
   *   get:
   *     summary: Get SAML configuration
   *     operationId: get-saml-config
   *     tags:
   *       - SAML Config
   *     parameters:
   *       - $ref: '#/parameters/tenantParam'
   *       - $ref: '#/parameters/productParam'
   *       - $ref: '#/parameters/clientIDParam'
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
   * parameters:
   *   clientID:
   *     name: clientID
   *     in: formData
   *     type: string
   *     description: Client ID
   *   clientSecret:
   *     name: clientSecret
   *     in: formData
   *     type: string
   *     description: Client Secret
   *   tenant:
   *     name: tenant
   *     in: formData
   *     type: string
   *     description: Tenant
   *   product:
   *     name: product
   *     in: formData
   *     type: string
   *     description: Product
   * /api/v1/oidc/connection:
   *   delete:
   *     parameters:
   *      - $ref: '#/parameters/clientID'
   *      - $ref: '#/parameters/clientSecret'
   *      - $ref: '#/parameters/tenant'
   *      - $ref: '#/parameters/product'
   *     summary: Delete OIDC Connection
   *     operationId: delete-oidc-connection
   *     tags: [OIDC Connection]
   * /api/v1/saml/config:
   *   delete:
   *     summary: Delete SAML configuration
   *     operationId: delete-saml-config
   *     tags:
   *       - SAML Config
   *     consumes:
   *       - application/x-www-form-urlencoded
   *     parameters:
   *      - $ref: '#/parameters/clientID'
   *      - $ref: '#/parameters/clientSecret'
   *      - $ref: '#/parameters/tenant'
   *      - $ref: '#/parameters/product'
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
