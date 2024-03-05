import * as dbutils from '../db/utils';
import * as metrics from '../opentelemetry/metrics';
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
  UpdateSAMLConnectionParams,
  UpdateOIDCConnectionParams,
  GetByProductParams,
  Index,
} from '../typings';
import { JacksonError } from './error';
import { IndexNames, appID, transformConnections, transformConnection, isConnectionActive } from './utils';
import oidcConnection from './connection/oidc';
import samlConnection from './connection/saml';
import { OryController } from '../ee/ory/ory';

export class ConnectionAPIController implements IConnectionAPIController {
  private connectionStore: Storable;
  private opts: JacksonOption;
  private eventController: IEventController;
  private oryController: OryController;

  constructor({ connectionStore, opts, eventController, oryController }) {
    this.connectionStore = connectionStore;
    this.opts = opts;
    this.eventController = eventController;
    this.oryController = oryController;
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
   *            "deactivated": false
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
   *   labelParamPost:
   *     name: label
   *     description: An internal label to identify the connection
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
   *   sortOrder:
   *    name: sortOrder
   *    description: Indicate the position of the connection in the IdP selection screen
   *    in: formData
   *    type: number
   *    required: false
   * /api/v1/sso:
   *   post:
   *     summary: Create SSO connection
   *     operationId: create-sso-connection
   *     tags: [Single Sign On]
   *     produces:
   *      - application/json
   *     consumes:
   *      - application/x-www-form-urlencoded
   *      - application/json
   *     parameters:
   *      - $ref: '#/parameters/nameParamPost'
   *      - $ref: '#/parameters/labelParamPost'
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
   *      - $ref: '#/parameters/sortOrder'
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
    metrics.increment('createConnection');

    const connection = await samlConnection.create(body, this.connectionStore, this.oryController);

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
    metrics.increment('createConnection');

    if (!this.opts.oidcPath) {
      throw new JacksonError('Please set OpenID response handler path (oidcPath) on Jackson', 500);
    }

    const connection = await oidcConnection.create(body, this.connectionStore, this.oryController);

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
   *   labelParamPatch:
   *     name: label
   *     description: An internal label to identify the connection
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
   *   deactivatedParamPatch:
   *     name: deactivated
   *     description: Connection status
   *     in: formData
   *     required: false
   *     type: boolean
   *   sortOrderParamPatch:
   *     name: sortOrder
   *     description: Indicate the position of the connection in the IdP selection screen
   *     in: formData
   *     type: number
   *     required: false
   * /api/v1/sso:
   *   patch:
   *     summary: Update SSO Connection
   *     operationId: update-sso-connection
   *     tags: [Single Sign On]
   *     consumes:
   *       - application/json
   *       - application/x-www-form-urlencoded
   *     parameters:
   *       - $ref: '#/parameters/clientIDParamPatch'
   *       - $ref: '#/parameters/clientSecretParamPatch'
   *       - $ref: '#/parameters/nameParamPatch'
   *       - $ref: '#/parameters/labelParamPatch'
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
   *       - $ref: '#/parameters/deactivatedParamPatch'
   *       - $ref: '#/parameters/sortOrderParamPatch'
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
  public async updateSAMLConnection(body: UpdateSAMLConnectionParams): Promise<void> {
    const connection = await samlConnection.update(
      body,
      this.connectionStore,
      this.getConnections.bind(this),
      this.oryController
    );

    if ('deactivated' in body) {
      if (isConnectionActive(connection)) {
        await this.eventController.notify('sso.activated', connection);
      } else {
        await this.eventController.notify('sso.deactivated', connection);
      }
    }
  }

  // For backwards compatibility
  public async updateConfig(
    ...args: Parameters<ConnectionAPIController['updateSAMLConnection']>
  ): Promise<void> {
    await this.updateSAMLConnection(...args);
  }

  public async updateOIDCConnection(body: UpdateOIDCConnectionParams): Promise<void> {
    if (!this.opts.oidcPath) {
      throw new JacksonError('Please set OpenID response handler path (oidcPath) on Jackson', 500);
    }

    const connection = await oidcConnection.update(
      body,
      this.connectionStore,
      this.getConnections.bind(this),
      this.oryController
    );

    if ('deactivated' in body) {
      if (isConnectionActive(connection)) {
        await this.eventController.notify('sso.activated', connection);
      } else {
        await this.eventController.notify('sso.deactivated', connection);
      }
    }
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
   *  sortParamGet:
   *     in: query
   *     name: sort
   *     type: string
   *     description: If present, the connections will be sorted by `sortOrder`. It won't consider if pagination is used.
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
   *        label:
   *          type: string
   *          description: Connection label
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
   *        deactivated:
   *          type: boolean
   *          description: Connection status
   *        sortOrder:
   *          type: number
   *          description: Connection sort order
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
   * /api/v1/sso:
   *   get:
   *     summary: Get SSO Connections
   *     parameters:
   *       - $ref: '#/parameters/tenantParamGet'
   *       - $ref: '#/parameters/productParamGet'
   *       - $ref: '#/parameters/clientIDParamGet'
   *       - $ref: '#/parameters/strategyParamGet'
   *       - $ref: '#/parameters/sortParamGet'
   *     operationId: get-connections
   *     tags: [Single Sign On]
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

    metrics.increment('getConnections');

    let connections: (SAMLSSORecord | OIDCSSORecord)[] | null = null;

    // Fetch connections by entityId
    if (entityId) {
      const result = await this.connectionStore.getByIndex({
        name: IndexNames.EntityID,
        value: entityId,
      });

      if (!result || typeof result !== 'object') {
        connections = [];
      } else {
        connections = result.data;
      }
    }

    // Fetch connections by clientID
    else if (clientID) {
      const result = await this.connectionStore.get(clientID);

      if (!result || typeof result !== 'object') {
        connections = [];
      } else {
        connections = [result];
      }
    }

    // Fetch connections by multiple tenants
    else if (tenant && product && Array.isArray(tenant)) {
      const tenants = tenant.filter((t) => t).filter((t, i, a) => a.indexOf(t) === i);

      const result = await Promise.all(
        tenants.map(async (t) =>
          this.connectionStore.getByIndex({
            name: IndexNames.TenantProduct,
            value: dbutils.keyFromParts(t, product),
          })
        )
      );

      if (!result || !result.length) {
        connections = [];
      } else {
        connections = result.flatMap((r) => r.data);
      }
    }

    // Fetch connections by tenant and product
    else if (tenant && product && !Array.isArray(tenant)) {
      const result = await this.connectionStore.getByIndex({
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      });

      if (!result || !result.data.length) {
        connections = [];
      } else {
        connections = result.data;
      }

      // Filter connections by strategy
      if (connections && connections.length > 0 && strategy) {
        connections = connections.filter((connection) => {
          if (strategy === 'saml') {
            return 'idpMetadata' in connection;
          }

          if (strategy === 'oidc') {
            return 'oidcProvider' in connection;
          }

          return false;
        });
      }
    }

    if (connections) {
      const sort = 'sort' in body ? body.sort : false;

      if (sort) {
        connections.sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));
      }

      return transformConnections(connections);
    }

    throw new JacksonError('Please provide `clientID` or `tenant` and `product`.', 400);
  }

  public async getConfig(body: GetConfigQuery): Promise<SAMLSSORecord | Record<string, never>> {
    const clientID = 'clientID' in body ? body.clientID : undefined;
    const tenant = 'tenant' in body ? body.tenant : undefined;
    const product = 'product' in body ? body.product : undefined;

    metrics.increment('getConnections');

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
   *     in: query
   *     type: string
   *     description: Client ID
   *   clientSecretDel:
   *     name: clientSecret
   *     in: query
   *     type: string
   *     description: Client Secret
   *   tenantDel:
   *     name: tenant
   *     in: query
   *     type: string
   *     description: Tenant
   *   productDel:
   *     name: product
   *     in: query
   *     type: string
   *     description: Product
   *   strategyDel:
   *     name: strategy
   *     in: query
   *     type: string
   *     description: Strategy which can help to filter connections with tenant/product query
   * /api/v1/sso:
   *   delete:
   *     parameters:
   *      - $ref: '#/parameters/clientIDDel'
   *      - $ref: '#/parameters/clientSecretDel'
   *      - $ref: '#/parameters/tenantDel'
   *      - $ref: '#/parameters/productDel'
   *      - $ref: '#/parameters/strategyDel'
   *     summary: Delete SSO Connections
   *     operationId: delete-sso-connection
   *     tags: [Single Sign On]
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

    metrics.increment('deleteConnections');

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

  /**
   * @swagger
   * parameters:
   *  productParamGet:
   *     in: query
   *     name: product
   *     type: string
   *     description: Product
   *     required: true
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
   *   '200GetByProduct':
   *     description: Success
   *     content:
   *      application/json:
   *         schema:
   *           type: object
   *           properties:
   *             data:
   *               type: array
   *               items:
   *                 $ref: '#/definitions/Connection'
   *             pageToken:
   *               type: string
   *               description: token for pagination
   *   '400Get':
   *     description: Please provide a `product`.
   *   '401Get':
   *     description: Unauthorized
   * /api/v1/sso/product:
   *   get:
   *     summary: Get SSO Connections by product
   *     parameters:
   *       - $ref: '#/parameters/productParamGet'
   *       - $ref: '#/parameters/pageOffset'
   *       - $ref: '#/parameters/pageLimit'
   *       - $ref: '#/parameters/pageToken'
   *     operationId: get-connections-by-product
   *     tags: [Single Sign On]
   *     responses:
   *      '200':
   *        $ref: '#/responses/200GetByProduct'
   *      '400':
   *        $ref: '#/responses/400Get'
   *      '401':
   *        $ref: '#/responses/401Get'
   */
  public async getConnectionsByProduct(
    body: GetByProductParams
  ): Promise<{ data: (SAMLSSORecord | OIDCSSORecord)[]; pageToken?: string }> {
    const { product, pageOffset, pageLimit, pageToken } = body;

    if (!product) {
      throw new JacksonError('Please provide a `product`.', 400);
    }

    const connections = await this.connectionStore.getByIndex(
      {
        name: IndexNames.Product,
        value: product,
      },
      pageOffset,
      pageLimit,
      pageToken
    );

    return { data: transformConnections(connections.data), pageToken };
  }

  public async getCount(idx?: Index) {
    return await this.connectionStore.getCount(idx);
  }
}
