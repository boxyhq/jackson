import * as dbutils from '../db/utils';
import * as metrics from '../opentelemetry/metrics';
import { IConnectionAPIController, IdPConnection, Storable } from '../typings';
import { JacksonError } from './error';
import { IndexNames } from './utils';
import oidcConnection from './connection/oidc';
import samlConnection from './connection/saml';

export class ConnectionAPIController implements IConnectionAPIController {
  private connectionStore: Storable;

  constructor({ connectionStore }) {
    this.connectionStore = connectionStore;
  }

  /**
   * @swagger
   * definitions:
   *    Connection:
   *      type: object
   *      example:
   *          {
   *            "idpMetadata": {
   *              "sso": {
   *                "postUrl": "https://dev-20901260.okta.com/app/dev-20901260_jacksonnext_1/xxxxxxxxxxxsso/saml",
   *                "redirectUrl": "https://dev-20901260.okta.com/app/dev-20901260_jacksonnext_1/xxxxxxxxxxxsso/saml"
   *              },
   *              "entityID": "http://www.okta.com/xxxxxxxxxxxxx",
   *              "thumbprint": "Eo+eUi3UM3XIMkFFtdVK3yJ5vO9f7YZdasdasdad",
   *              "loginType": "idp",
   *              "provider": "okta.com"
   *            },
   *            "defaultRedirectUrl": "https://hoppscotch.io/",
   *            "redirectUrl": ["https://hoppscotch.io/"],
   *            "tenant": "hoppscotch.io",
   *            "product": "API Engine",
   *            "name": "Hoppscotch-SP",
   *            "description": "SP for hoppscotch.io",
   *            "clientID": "Xq8AJt3yYAxmXizsCWmUBDRiVP1iTC8Y/otnvFIMitk",
   *            "clientSecret": "00e3e11a3426f97d8000000738300009130cd45419c5943",
   *            "certs": {
   *              "publicKey": "-----BEGIN CERTIFICATE-----.......-----END CERTIFICATE-----",
   *              "privateKey": "-----BEGIN PRIVATE KEY-----......-----END PRIVATE KEY-----"
   *            }
   *          }
   *    validationErrorsPost:
   *      description: Please provide rawMetadata or encodedRawMetadata | Please provide a defaultRedirectUrl | Please provide redirectUrl | redirectUrl is invalid | Exceeded maximum number of allowed redirect urls | defaultRedirectUrl is invalid | Please provide tenant | Please provide product | Please provide a friendly name | Description should not exceed 100 characters | Strategy&#58; xxxx not supported
   *
   * parameters:
   *   nameParamPost:
   *     name: name
   *     description: Name/identifier for the connection
   *     type: string
   *     in: formData
   *   descriptionParamPost:
   *     name: description
   *     description: A short description for the connection not more than 100 characters
   *     type: string
   *     in: formData
   *   encodedRawMetadataParamPost:
   *     name: encodedRawMetadata
   *     description: Base64 encoding of the XML metadata
   *     in: formData
   *     type: string
   *   rawMetadataParamPost:
   *     name: rawMetadata
   *     description: Raw XML metadata
   *     in: formData
   *     type: string
   *   defaultRedirectUrlParamPost:
   *     name: defaultRedirectUrl
   *     description: The redirect URL to use in the IdP login flow
   *     in: formData
   *     required: true
   *     type: string
   *   redirectUrlParamPost:
   *     name: redirectUrl
   *     description: JSON encoded array containing a list of allowed redirect URLs
   *     in: formData
   *     required: true
   *     type: string
   *   tenantParamPost:
   *     name: tenant
   *     description: Tenant
   *     in: formData
   *     required: true
   *     type: string
   *   productParamPost:
   *     name: product
   *     description: Product
   *     in: formData
   *     required: true
   *     type: string
   * /api/v1/saml/config:
   *   post:
   *    summary: Create SAML config
   *    operationId: create-saml-config
   *    deprecated: true
   *    tags: [SAML Config - Deprecated]
   *    produces:
   *      - application/json
   *    consumes:
   *      - application/x-www-form-urlencoded
   *      - application/json
   *    parameters:
   *      - $ref: '#/parameters/nameParamPost'
   *      - $ref: '#/parameters/descriptionParamPost'
   *      - $ref: '#/parameters/encodedRawMetadataParamPost'
   *      - $ref: '#/parameters/rawMetadataParamPost'
   *      - $ref: '#/parameters/defaultRedirectUrlParamPost'
   *      - $ref: '#/parameters/redirectUrlParamPost'
   *      - $ref: '#/parameters/tenantParamPost'
   *      - $ref: '#/parameters/productParamPost'
   *    responses:
   *      200:
   *        description: Success
   *        schema:
   *          $ref:  '#/definitions/Connection'
   *      400:
   *          $ref: '#/definitions/validationErrorsPost'
   *      401:
   *        description: Unauthorized
   * /api/v1/saml/connection:
   *   post:
   *     summary: Create SAML connection
   *     operationId: create-saml-connection
   *     tags: [SAML Connection]
   *     produces:
   *      - application/json
   *     consumes:
   *      - application/x-www-form-urlencoded
   *      - application/json
   *     parameters:
   *      - $ref: '#/parameters/nameParamPost'
   *      - $ref: '#/parameters/descriptionParamPost'
   *      - $ref: '#/parameters/encodedRawMetadataParamPost'
   *      - $ref: '#/parameters/rawMetadataParamPost'
   *      - $ref: '#/parameters/defaultRedirectUrlParamPost'
   *      - $ref: '#/parameters/redirectUrlParamPost'
   *      - $ref: '#/parameters/tenantParamPost'
   *      - $ref: '#/parameters/productParamPost'
   *     responses:
   *       200:
   *         description: Success
   *         schema:
   *           $ref: '#/definitions/Connection'
   *       400:
   *           $ref: '#/definitions/validationErrorsPost'
   *       401:
   *         description: Unauthorized
   */
  public async createSAMLConnection(body: IdPConnection): Promise<any> {
    metrics.increment('createConnection');
    const record = await samlConnection.create(body, this.connectionStore);
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
   *     summary: Create OIDC Connection
   *     operationId: create-oidc-connection
   *     tags: [OIDC Connection]
   *     produces:
   *       - application/json
   *     consumes:
   *       - application/x-www-form-urlencoded
   *       - application/json
   *     parameters:
   *       - name: name
   *         description: Name/identifier for the connection
   *         type: string
   *         in: formData
   *       - name: description
   *         description: A short description for the connection not more than 100 characters
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
    metrics.increment('createConnection');
    const record = await oidcConnection.create(body, this.connectionStore);
    return record;
  }
  /**
   * @swagger
   * definitions:
   *   validationErrorsPatch:
   *     description: Please provide clientID | Please provide clientSecret | clientSecret mismatch | Tenant/Product config mismatch with IdP metadata | Description should not exceed 100 characters| redirectUrl is invalid | Exceeded maximum number of allowed redirect urls | defaultRedirectUrl is invalid
   * parameters:
   *   clientIDParamPatch:
   *     name: clientID
   *     description: Client ID for the connection
   *     type: string
   *     in: formData
   *     required: true
   *   clientSecretParamPatch:
   *     name: clientSecret
   *     description: Client Secret for the connection
   *     type: string
   *     in: formData
   *     required: true
   *   nameParamPatch:
   *     name: name
   *     description: Name/identifier for the connection
   *     type: string
   *     in: formData
   *   descriptionParamPatch:
   *     name: description
   *     description: A short description for the connection not more than 100 characters
   *     type: string
   *     in: formData
   *   encodedRawMetadataParamPatch:
   *     name: encodedRawMetadata
   *     description: Base64 encoding of the XML metadata
   *     in: formData
   *     type: string
   *   rawMetadataParamPatch:
   *     name: rawMetadata
   *     description: Raw XML metadata
   *     in: formData
   *     type: string
   *   defaultRedirectUrlParamPatch:
   *     name: defaultRedirectUrl
   *     description: The redirect URL to use in the IdP login flow
   *     in: formData
   *     type: string
   *   redirectUrlParamPatch:
   *     name: redirectUrl
   *     description: JSON encoded array containing a list of allowed redirect URLs
   *     in: formData
   *     type: string
   *   tenantParamPatch:
   *     name: tenant
   *     description: Tenant
   *     in: formData
   *     required: true
   *     type: string
   *   productParamPatch:
   *     name: product
   *     description: Product
   *     in: formData
   *     required: true
   *     type: string
   * /api/v1/saml/config:
   *   patch:
   *     summary: Update SAML Config
   *     operationId: update-saml-config
   *     tags: [SAML Config - Deprecated]
   *     deprecated: true
   *     consumes:
   *       - application/json
   *       - application/x-www-form-urlencoded
   *     parameters:
   *       - $ref: '#/parameters/clientIDParamPatch'
   *       - $ref: '#/parameters/clientSecretParamPatch'
   *       - $ref: '#/parameters/nameParamPatch'
   *       - $ref: '#/parameters/descriptionParamPatch'
   *       - $ref: '#/parameters/encodedRawMetadataParamPatch'
   *       - $ref: '#/parameters/rawMetadataParamPatch'
   *       - $ref: '#/parameters/defaultRedirectUrlParamPatch'
   *       - $ref: '#/parameters/redirectUrlParamPatch'
   *       - $ref: '#/parameters/tenantParamPatch'
   *       - $ref: '#/parameters/productParamPatch'
   *     responses:
   *       204:
   *         description: Success
   *       400:
   *         $ref: '#/definitions/validationErrorsPatch'
   *       401:
   *         description: Unauthorized
   * /api/v1/saml/connection:
   *   patch:
   *     summary: Update SAML Connection
   *     operationId: update-saml-connection
   *     tags: [SAML Connection]
   *     consumes:
   *       - application/json
   *       - application/x-www-form-urlencoded
   *     parameters:
   *       - $ref: '#/parameters/clientIDParamPatch'
   *       - $ref: '#/parameters/clientSecretParamPatch'
   *       - $ref: '#/parameters/nameParamPatch'
   *       - $ref: '#/parameters/descriptionParamPatch'
   *       - $ref: '#/parameters/encodedRawMetadataParamPatch'
   *       - $ref: '#/parameters/rawMetadataParamPatch'
   *       - $ref: '#/parameters/defaultRedirectUrlParamPatch'
   *       - $ref: '#/parameters/redirectUrlParamPatch'
   *       - $ref: '#/parameters/tenantParamPatch'
   *       - $ref: '#/parameters/productParamPatch'
   *     responses:
   *       204:
   *         description: Success
   *       400:
   *         $ref: '#/definitions/validationErrorsPatch'
   *       401:
   *         description: Unauthorized
   */
  public async updateSAMLConnection(
    body: IdPConnection & { clientID: string; clientSecret: string }
  ): Promise<void> {
    await samlConnection.update(body, this.connectionStore, this.getConnection.bind(this));
  }

  // For backwards compatibility
  public async updateConfig(
    ...args: Parameters<ConnectionAPIController['updateSAMLConnection']>
  ): Promise<any> {
    await this.updateSAMLConnection(...args);
  }
  /**
   * @swagger
   * /api/v1/oidc/connection:
   *   patch:
   *     summary: Update OIDC Connection
   *     operationId: update-oidc-connection
   *     tags: [OIDC Connection]
   *     consumes:
   *       - application/json
   *       - application/x-www-form-urlencoded
   *     parameters:
   *       - name: clientID
   *         description: Client ID for the connection
   *         type: string
   *         in: formData
   *         required: true
   *       - name: clientSecret
   *         description: Client Secret for the connection
   *         type: string
   *         in: formData
   *         required: true
   *       - name: name
   *         description: Name/identifier for the connection
   *         type: string
   *         in: formData
   *       - name: description
   *         description: A short description for the connection not more than 100 characters
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
  public async updateOIDCConnection(
    body: IdPConnection & { clientID: string; clientSecret: string }
  ): Promise<void> {
    await oidcConnection.update(body, this.connectionStore, this.getConnection.bind(this));
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
   * responses:
   *   '200':
   *     description: Success
   *     schema:
   *       type: object
   *       example:
   *         {
   *           "idpMetadata": {
   *             "sso": {
   *               "postUrl": "https://dev-20901260.okta.com/app/dev-20901260_jacksonnext_1/xxxxxxxxxxxxx/sso/saml",
   *               "redirectUrl": "https://dev-20901260.okta.com/app/dev-20901260_jacksonnext_1/xxxxxxxxxxxxx/sso/saml"
   *             },
   *             "entityID": "http://www.okta.com/xxxxxxxxxxxxx",
   *             "thumbprint": "Eo+eUi3UM3XIMkFFtdVK3yJ5vO9f7YZdasdasdad",
   *             "loginType": "idp",
   *             "provider": "okta.com"
   *           },
   *           "defaultRedirectUrl": "https://hoppscotch.io/",
   *           "redirectUrl": ["https://hoppscotch.io/"],
   *           "tenant": "hoppscotch.io",
   *           "product": "API Engine",
   *           "name": "Hoppscotch-SP",
   *           "description": "SP for hoppscotch.io",
   *           "clientID": "Xq8AJt3yYAxmXizsCWmUBDRiVP1iTC8Y/otnvFIMitk",
   *           "clientSecret": "00e3e11a3426f97d8000000738300009130cd45419c5943",
   *           "certs": {
   *             "publicKey": "-----BEGIN CERTIFICATE-----.......-----END CERTIFICATE-----",
   *             "privateKey": "-----BEGIN PRIVATE KEY-----......-----END PRIVATE KEY-----"
   *           }
   *       }
   *   '400':
   *     description: Please provide `clientID` or `tenant` and `product`. | connection type mismatch
   *   '401':
   *     description: Unauthorized
   * /api/v1/oidc/connection:
   *   get:
   *     summary: Get OIDC Connection
   *     parameters:
   *       - $ref: '#/parameters/tenantParam'
   *       - $ref: '#/parameters/productParam'
   *       - $ref: '#/parameters/clientIDParam'
   *     operationId: get-oidc-connection
   *     tags: [OIDC Connection]
   *     responses:
   *      '200':
   *        $ref: '#/responses/200'
   *      '400':
   *        $ref: '#/responses/400'
   *      '401':
   *        $ref: '#/responses/401'
   * /api/v1/saml/connection:
   *   get:
   *     summary: Get SAML Connection
   *     operationId: get-saml-connection
   *     tags: [SAML Connection]
   *     parameters:
   *       - $ref: '#/parameters/tenantParam'
   *       - $ref: '#/parameters/productParam'
   *       - $ref: '#/parameters/clientIDParam'
   *     responses:
   *      '200':
   *        $ref: '#/responses/200'
   *      '400':
   *        $ref: '#/responses/400'
   *      '401':
   *        $ref: '#/responses/401'
   */
  public async getConnection(body: {
    clientID?: string;
    tenant?: string;
    product?: string;
    strategy?: 'saml' | 'oidc';
  }): Promise<any> {
    const { clientID, tenant, product, strategy } = body;

    metrics.increment('getConnection');

    if (clientID) {
      const connection = await this.connectionStore.get(clientID);

      if (!connection || typeof connection !== 'object') {
        return {};
      }

      if (strategy === 'saml' && connection.oidcProvider && !connection.idpMetadata) {
        throw new JacksonError('connection type mismatch', 400);
      }

      if (strategy === 'oidc' && connection.idpMetadata && !connection.oidcProvider) {
        throw new JacksonError('connection type mismatch', 400);
      }
      return connection;
    }

    if (tenant && product) {
      const connections = await this.connectionStore.getByIndex({
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      });

      if (!connections || !connections.length) {
        return {};
      }
      // filter if strategy is passed
      const filteredConnections = connections.filter((connection) => {
        if (!strategy) {
          return true;
        }
        if (strategy === 'saml') {
          if (connection.idpMetadata) {
            return true;
          }
        }
        if (strategy === 'oidc') {
          if (connection.oidcProvider) {
            return true;
          }
        }
        return false;
      });

      if (!filteredConnections.length) {
        return {};
      }
      return { ...filteredConnections[0] };
    }

    throw new JacksonError('Please provide `clientID` or `tenant` and `product`.', 400);
  }

  public async getConfig(body: { clientID?: string; tenant?: string; product?: string }): Promise<any> {
    return await this.getConnection({ ...body, strategy: 'saml' });
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
   *     responses:
   *       '200':
   *         description: Success
   *       '400':
   *         description: connection type mismatch | clientSecret mismatch | Please provide `clientID` and `clientSecret` or `tenant` and `product`.
   *       '401':
   *         description: Unauthorized
   * /api/v1/saml/connection:
   *   delete:
   *     summary: Delete SAML Connection
   *     operationId: delete-saml-connection
   *     tags: [SAML Connection]
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
   *         description: connection type mismatch | clientSecret mismatch | Please provide `clientID` and `clientSecret` or `tenant` and `product`.
   *       '401':
   *         description: Unauthorized
   */
  public async deleteConnection(body: {
    clientID?: string;
    clientSecret?: string;
    tenant?: string;
    product?: string;
    strategy?: 'saml' | 'oidc';
  }): Promise<void> {
    const { clientID, clientSecret, tenant, product, strategy } = body;

    metrics.increment('deleteConnection');

    if (clientID && clientSecret) {
      const connection = await this.connectionStore.get(clientID);

      if (!connection) {
        return;
      }

      if (strategy === 'saml' && connection.oidcProvider && !connection.idpMetadata) {
        throw new JacksonError('connection type mismatch', 400);
      }

      if (strategy === 'oidc' && connection.idpMetadata && !connection.oidcProvider) {
        throw new JacksonError('connection type mismatch', 400);
      }
      if (connection.clientSecret === clientSecret) {
        await this.connectionStore.delete(clientID);
      } else {
        throw new JacksonError('clientSecret mismatch', 400);
      }

      return;
    }

    if (tenant && product) {
      const connections = await this.connectionStore.getByIndex({
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      });

      if (!connections || !connections.length) {
        return;
      }
      // filter if strategy is passed
      const filteredConnections = connections.filter((connection) => {
        if (!strategy) {
          return true;
        }
        if (strategy === 'saml') {
          if (connection.idpMetadata) {
            return true;
          }
        }
        if (strategy === 'oidc') {
          if (connection.oidcProvider) {
            return true;
          }
        }
        return false;
      });

      for (const conf of filteredConnections) {
        await this.connectionStore.delete(conf.clientID);
      }

      return;
    }

    throw new JacksonError('Please provide `clientID` and `clientSecret` or `tenant` and `product`.', 400);
  }
  public async deleteConfig(body: {
    clientID?: string;
    clientSecret?: string;
    tenant?: string;
    product?: string;
  }): Promise<void> {
    await this.deleteConnection({ ...body, strategy: 'saml' });
  }
}
