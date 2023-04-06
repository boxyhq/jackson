import * as dbutils from '../db/utils';
import { counters } from '../opentelemetry/metrics';
import {
  GetConfigQuery,
  GetConnectionsQuery,
  DelConnectionsQuery,
  IConnectionAPIController,
  Storable,
  SAMLSSOConnectionWithEncodedMetadata,
  SAMLSSOConnectionWithRawMetadata,
  OIDCSSOConnectionWithDiscoveryUrl,
  OIDCSSOConnectionWithMetadata,
  JacksonOption,
  SAMLSSORecord,
  OIDCSSORecord,
  GetIDPEntityIDBody,
  IEventController,
} from '../typings';
import { JacksonError } from './error';
import { IndexNames, appID, transformConnections, transformConnection } from './utils';
import oidcConnection from './connection/oidc';
import samlConnection from './connection/saml';

export class ConnectionAPIController implements IConnectionAPIController {
  private connectionStore: Storable;
  private opts: JacksonOption;
  private eventController: IEventController;

  constructor({ connectionStore, opts, eventController }) {
    this.connectionStore = connectionStore;
    this.opts = opts;
    this.eventController = eventController;
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
   *          }
   *    validationErrorsPost:
   *      description: Please provide rawMetadata or encodedRawMetadata | Please provide a defaultRedirectUrl | Please provide redirectUrl | redirectUrl is invalid | Exceeded maximum number of allowed redirect urls | defaultRedirectUrl is invalid | Please provide tenant | Please provide product | Please provide a friendly name | Description should not exceed 100 characters | Strategy&#58; xxxx not supported | Please provide the clientId from OpenID Provider | Please provide the clientSecret from OpenID Provider | Please provide the discoveryUrl for the OpenID Provider
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
   *   metadataUrlParamPost:
   *     name: metadataUrl
   *     description: URL containing raw XML metadata
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
   *   oidcDiscoveryUrlPost:
   *     name: oidcDiscoveryUrl
   *     description: well-known URL where the OpenID Provider configuration is exposed
   *     in: formData
   *     type: string
   *   oidcMetadataPost:
   *     name: oidcMetadata
   *     description: metadata (JSON) for the OpenID Provider in the absence of discoveryUrl
   *     in: formData
   *     type: string
   *   oidcClientIdPost:
   *     name: oidcClientId
   *     description: clientId of the application set up on the OpenID Provider
   *     in: formData
   *     type: string
   *   oidcClientSecretPost:
   *     name: oidcClientSecret
   *     description: clientSecret of the application set up on the OpenID Provider
   *     in: formData
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
   *      - $ref: '#/parameters/metadataUrlParamPost'
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
   *      500:
   *        description: Please set OpenID response handler path (oidcPath) on Jackson
   * /api/v1/connections:
   *   post:
   *     summary: Create SSO connection
   *     operationId: create-sso-connection
   *     tags: [Connections]
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
   *      - $ref: '#/parameters/metadataUrlParamPost'
   *      - $ref: '#/parameters/defaultRedirectUrlParamPost'
   *      - $ref: '#/parameters/redirectUrlParamPost'
   *      - $ref: '#/parameters/tenantParamPost'
   *      - $ref: '#/parameters/productParamPost'
   *      - $ref: '#/parameters/oidcDiscoveryUrlPost'
   *      - $ref: '#/parameters/oidcMetadataPost'
   *      - $ref: '#/parameters/oidcClientIdPost'
   *      - $ref: '#/parameters/oidcClientSecretPost'
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
  public async createSAMLConnection(
    body: SAMLSSOConnectionWithEncodedMetadata | SAMLSSOConnectionWithRawMetadata
  ): Promise<SAMLSSORecord> {
    counters.createConnection.increment();

    const connection = await samlConnection.create(body, this.connectionStore);

    await this.eventController.notify('sso.created', connection);

    return connection;
  }

  // For backwards compatibility
  public async config(
    ...args: Parameters<ConnectionAPIController['createSAMLConnection']>
  ): Promise<SAMLSSORecord> {
    return this.createSAMLConnection(...args);
  }

  public async createOIDCConnection(
    body: OIDCSSOConnectionWithDiscoveryUrl | OIDCSSOConnectionWithMetadata
  ): Promise<OIDCSSORecord> {
    counters.createConnection.increment();

    if (!this.opts.oidcPath) {
      throw new JacksonError('Please set OpenID response handler path (oidcPath) on Jackson', 500);
    }

    const connection = await oidcConnection.create(body, this.connectionStore);

    await this.eventController.notify('sso.created', connection);

    return connection;
  }

  /**
   * @swagger
   * definitions:
   *   validationErrorsPatch:
   *     description: Please provide clientID | Please provide clientSecret | clientSecret mismatch | Tenant/Product config mismatch with IdP metadata | Description should not exceed 100 characters| redirectUrl is invalid | Exceeded maximum number of allowed redirect urls | defaultRedirectUrl is invalid | Tenant/Product config mismatch with OIDC Provider metadata
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
   *   metadataUrlParamPatch:
   *     name: metadataUrl
   *     description: URL containing raw XML metadata
   *     in: formData
   *     type: string
   *   oidcDiscoveryUrlPatch:
   *     name: oidcDiscoveryUrl
   *     description: well-known URL where the OpenID Provider configuration is exposed
   *     in: formData
   *     type: string
   *   oidcMetadataPatch:
   *     name: oidcMetadata
   *     description: metadata (JSON) for the OpenID Provider in the absence of discoveryUrl
   *     in: formData
   *     type: string
   *   oidcClientIdPatch:
   *     name: oidcClientId
   *     description: clientId of the application set up on the OpenID Provider
   *     in: formData
   *     type: string
   *   oidcClientSecretPatch:
   *     name: oidcClientSecret
   *     description: clientSecret of the application set up on the OpenID Provider
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
   *       - $ref: '#/parameters/metadataUrlParamPatch'
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
   * /api/v1/connections:
   *   patch:
   *     summary: Update SSO Connection
   *     operationId: update-sso-connection
   *     tags: [Connections]
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
   *       - $ref: '#/parameters/metadataUrlParamPatch'
   *       - $ref: '#/parameters/oidcDiscoveryUrlPatch'
   *       - $ref: '#/parameters/oidcMetadataPatch'
   *       - $ref: '#/parameters/oidcClientIdPatch'
   *       - $ref: '#/parameters/oidcClientSecretPatch'
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
   *       500:
   *         description: Please set OpenID response handler path (oidcPath) on Jackson
   */
  public async updateSAMLConnection(
    body: (SAMLSSOConnectionWithEncodedMetadata | SAMLSSOConnectionWithRawMetadata) & {
      clientID: string;
      clientSecret: string;
    }
  ): Promise<void> {
    await samlConnection.update(body, this.connectionStore, this.getConnections.bind(this));
  }

  // For backwards compatibility
  public async updateConfig(
    ...args: Parameters<ConnectionAPIController['updateSAMLConnection']>
  ): Promise<void> {
    await this.updateSAMLConnection(...args);
  }

  public async updateOIDCConnection(
    body: (OIDCSSOConnectionWithDiscoveryUrl | OIDCSSOConnectionWithMetadata) & {
      clientID: string;
      clientSecret: string;
    }
  ): Promise<void> {
    if (!this.opts.oidcPath) {
      throw new JacksonError('Please set OpenID response handler path (oidcPath) on Jackson', 500);
    }

    await oidcConnection.update(body, this.connectionStore, this.getConnections.bind(this));
  }

  public getIDPEntityID(body: GetIDPEntityIDBody): string {
    const tenant = 'tenant' in body ? body.tenant : undefined;
    const product = 'product' in body ? body.product : undefined;
    if (!tenant || !product) {
      throw new JacksonError('Please provide `tenant` and `product`.', 400);
    } else {
      return `${this.opts.samlAudience}/${appID(tenant, product)}`;
    }
  }

  /**
   * @swagger
   * parameters:
   *  tenantParamGet:
   *     in: query
   *     name: tenant
   *     type: string
   *     description: Tenant
   *  productParamGet:
   *     in: query
   *     name: product
   *     type: string
   *     description: Product
   *  clientIDParamGet:
   *     in: query
   *     name: clientID
   *     type: string
   *     description: Client ID
   *  strategyParamGet:
   *     in: query
   *     name: strategy
   *     type: string
   *     description: Strategy which can help to filter connections with tenant/product query
   * definitions:
   *   Connection:
   *      type: object
   *      properties:
   *        clientID:
   *          type: string
   *          description: Connection clientID
   *        clientSecret:
   *          type: string
   *          description: Connection clientSecret
   *        name:
   *          type: string
   *          description: Connection name
   *        description:
   *          type: string
   *          description: Connection description
   *        redirectUrl:
   *          type: string
   *          description: A list of allowed redirect URLs
   *        defaultRedirectUrl:
   *          type: string
   *          description: The redirect URL to use in the IdP login flow
   *        tenant:
   *          type: string
   *          description: Connection tenant
   *        product:
   *          type: string
   *          description: Connection product
   *        idpMetadata:
   *          type: object
   *          description: SAML IdP metadata
   *        oidcProvider:
   *          type: object
   *          description: OIDC IdP metadata
   * responses:
   *   '200Get':
   *     description: Success
   *     schema:
   *       type: array
   *       items:
   *         $ref: '#/definitions/Connection'
   *   '400Get':
   *     description: Please provide `clientID` or `tenant` and `product`.
   *   '401Get':
   *     description: Unauthorized
   * /api/v1/connections:
   *   get:
   *     summary: Get SSO Connections
   *     parameters:
   *       - $ref: '#/parameters/tenantParamGet'
   *       - $ref: '#/parameters/productParamGet'
   *       - $ref: '#/parameters/clientIDParamGet'
   *       - $ref: '#/parameters/strategyParamGet'
   *     operationId: get-connections
   *     tags: [Connections]
   *     responses:
   *      '200':
   *        $ref: '#/responses/200Get'
   *      '400':
   *        $ref: '#/responses/400Get'
   *      '401':
   *        $ref: '#/responses/401Get'
   */
  public async getConnections(body: GetConnectionsQuery): Promise<Array<SAMLSSORecord | OIDCSSORecord>> {
    const clientID = 'clientID' in body ? body.clientID : undefined;
    const tenant = 'tenant' in body ? body.tenant : undefined;
    const product = 'product' in body ? body.product : undefined;
    const strategy = 'strategy' in body ? body.strategy : undefined;
    const entityId = 'entityId' in body ? body.entityId : undefined;

    counters.getConnections.increment();

    if (entityId) {
      const connections = await this.connectionStore.getByIndex({
        name: IndexNames.EntityID,
        value: entityId,
      });

      if (!connections || typeof connections !== 'object') {
        return [];
      }

      return transformConnections(connections.data);
    }

    if (clientID) {
      const connection = await this.connectionStore.get(clientID);

      if (!connection || typeof connection !== 'object') {
        return [];
      }

      return transformConnections([connection]);
    }

    if (tenant && product) {
      const connections = await this.connectionStore.getByIndex({
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      });

      if (!connections || !connections.data.length) {
        return [];
      }

      // filter if strategy is passed
      const filteredConnections = strategy
        ? connections.data.filter((connection) => {
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
          })
        : connections.data;

      if (!filteredConnections.length) {
        return [];
      }

      return transformConnections(filteredConnections);
    }

    throw new JacksonError('Please provide `clientID` or `tenant` and `product`.', 400);
  }

  /**
   * @swagger
   * /api/v1/saml/config:
   *   get:
   *     summary: Get SAML Config
   *     operationId: get-saml-config
   *     tags: [SAML Config - Deprecated]
   *     deprecated: true
   *     parameters:
   *       - $ref: '#/parameters/tenantParamGet'
   *       - $ref: '#/parameters/productParamGet'
   *       - $ref: '#/parameters/clientIDParamGet'
   *     responses:
   *      '200':
   *         description: Success
   *         schema:
   *           type: object
   *           example:
   *             {
   *                "idpMetadata": {
   *                  "sso": {
   *                    "postUrl": "https://dev-20901260.okta.com/app/dev-20901260_jacksonnext_1/xxxxxxxxxxxxx/sso/saml",
   *                    "redirectUrl": "https://dev-20901260.okta.com/app/dev-20901260_jacksonnext_1/xxxxxxxxxxxxx/sso/saml"
   *                  },
   *                  "entityID": "http://www.okta.com/xxxxxxxxxxxxx",
   *                  "thumbprint": "Eo+eUi3UM3XIMkFFtdVK3yJ5vO9f7YZdasdasdad",
   *                  "loginType": "idp",
   *                  "provider": "okta.com"
   *                },
   *                "defaultRedirectUrl": "https://hoppscotch.io/",
   *                "redirectUrl": ["https://hoppscotch.io/"],
   *                "tenant": "hoppscotch.io",
   *                "product": "API Engine",
   *                "name": "Hoppscotch-SP",
   *                "description": "SP for hoppscotch.io",
   *                "clientID": "Xq8AJt3yYAxmXizsCWmUBDRiVP1iTC8Y/otnvFIMitk",
   *                "clientSecret": "00e3e11a3426f97d8000000738300009130cd45419c5943",
   *            }
   *      '400':
   *        $ref: '#/responses/400Get'
   *      '401':
   *        $ref: '#/responses/401Get'
   */
  public async getConfig(body: GetConfigQuery): Promise<SAMLSSORecord | Record<string, never>> {
    const clientID = 'clientID' in body ? body.clientID : undefined;
    const tenant = 'tenant' in body ? body.tenant : undefined;
    const product = 'product' in body ? body.product : undefined;

    counters.getConnections.increment();

    if (clientID) {
      const samlConfig = await this.connectionStore.get(clientID);

      return samlConfig || {};
    }

    if (tenant && product) {
      const samlConfigs = (
        await this.connectionStore.getByIndex({
          name: IndexNames.TenantProduct,
          value: dbutils.keyFromParts(tenant, product),
        })
      ).data;

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
   *   clientIDDel:
   *     name: clientID
   *     in: formData
   *     type: string
   *     description: Client ID
   *   clientSecretDel:
   *     name: clientSecret
   *     in: formData
   *     type: string
   *     description: Client Secret
   *   tenantDel:
   *     name: tenant
   *     in: formData
   *     type: string
   *     description: Tenant
   *   productDel:
   *     name: product
   *     in: formData
   *     type: string
   *     description: Product
   *   strategyDel:
   *     name: strategy
   *     in: formData
   *     type: string
   *     description: Strategy which can help to filter connections with tenant/product query
   * /api/v1/connections:
   *   delete:
   *     parameters:
   *      - $ref: '#/parameters/clientIDDel'
   *      - $ref: '#/parameters/clientSecretDel'
   *      - $ref: '#/parameters/tenantDel'
   *      - $ref: '#/parameters/productDel'
   *      - $ref: '#/parameters/strategyDel'
   *     summary: Delete SSO Connections
   *     operationId: delete-sso-connection
   *     tags: [Connections]
   *     consumes:
   *       - application/x-www-form-urlencoded
   *       - application/json
   *     responses:
   *       '200':
   *         description: Success
   *       '400':
   *         description: clientSecret mismatch | Please provide `clientID` and `clientSecret` or `tenant` and `product`.
   *       '401':
   *         description: Unauthorized
   * /api/v1/saml/config:
   *   delete:
   *     summary: Delete SAML Config
   *     operationId: delete-saml-config
   *     tags: [SAML Config - Deprecated]
   *     deprecated: true
   *     consumes:
   *       - application/x-www-form-urlencoded
   *       - application/json
   *     parameters:
   *      - $ref: '#/parameters/clientIDDel'
   *      - $ref: '#/parameters/clientSecretDel'
   *      - $ref: '#/parameters/tenantDel'
   *      - $ref: '#/parameters/productDel'
   *     responses:
   *       '200':
   *         description: Success
   *       '400':
   *         description: clientSecret mismatch | Please provide `clientID` and `clientSecret` or `tenant` and `product`.
   *       '401':
   *         description: Unauthorized
   */
  public async deleteConnections(body: DelConnectionsQuery): Promise<void> {
    const clientID = 'clientID' in body ? body.clientID : undefined;
    const clientSecret = 'clientSecret' in body ? body.clientSecret : undefined;
    const tenant = 'tenant' in body ? body.tenant : undefined;
    const product = 'product' in body ? body.product : undefined;
    const strategy = 'strategy' in body ? body.strategy : undefined;

    counters.deleteConnections.increment();

    if (clientID && clientSecret) {
      const connection = await this.connectionStore.get(clientID);

      if (!connection) {
        return;
      }

      if (connection.clientSecret === clientSecret) {
        await this.connectionStore.delete(clientID);
        await this.eventController.notify('sso.deleted', transformConnection(connection));
      } else {
        throw new JacksonError('clientSecret mismatch', 400);
      }

      return;
    }

    if (tenant && product) {
      const connections = (
        await this.connectionStore.getByIndex({
          name: IndexNames.TenantProduct,
          value: dbutils.keyFromParts(tenant, product),
        })
      ).data;

      if (!connections || !connections.length) {
        return;
      }

      // filter if strategy is passed
      const filteredConnections = strategy
        ? connections.filter((connection) => {
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
          })
        : connections;

      for (const conf of transformConnections(filteredConnections)) {
        await this.connectionStore.delete(conf.clientID);
        await this.eventController.notify('sso.deleted', conf);
      }

      return;
    }

    throw new JacksonError('Please provide `clientID` and `clientSecret` or `tenant` and `product`.', 400);
  }

  public async deleteConfig(body: DelConnectionsQuery): Promise<void> {
    await this.deleteConnections({ ...body, strategy: 'saml' });
  }
}
