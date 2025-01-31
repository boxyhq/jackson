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
   * @openapi
   * components:
   *   schemas:
   *     formData_nameParamPost:
   *       type: string
   *       description: Name of connection
   *     formData_labelParamPost:
   *       type: string
   *       description: An internal label to identify the connection
   *     formData_descriptionParamPost:
   *       type: string
   *       description: A short description for the connection not more than 100 characters
   *     formData_encodedRawMetadataParamPost:
   *       type: string
   *       description: Base64 encoding of the XML metadata
   *     formData_rawMetadataParamPost:
   *       type: string
   *       description: Raw XML metadata
   *     formData_metadataUrlParamPost:
   *       type: string
   *       description: URL containing raw XML metadata
   *     formData_defaultRedirectUrlParamPost:
   *       type: string
   *       description: The redirect URL to use in the IdP login flow
   *     formData_redirectUrlParamPost:
   *       type: string
   *       description: JSON encoded array containing a list of allowed redirect URLs
   *     formData_tenantParamPost:
   *       type: string
   *       description: Tenant
   *     formData_productParamPost:
   *       type: string
   *       description: Product
   *     formData_oidcDiscoveryUrlPost:
   *       type: string
   *       description: well-known URL where the OpenID Provider configuration is exposed
   *     formData_oidcMetadataPost:
   *       type: string
   *       description: metadata (JSON) for the OpenID Provider in the absence of discoveryUrl
   *     formData_oidcClientIdPost:
   *       type: string
   *       description: clientId of the application set up on the OpenID Provider
   *     formData_oidcClientSecretPost:
   *       type: string
   *       description: clientSecret of the application set up on the OpenID Provider
   *     formData_sortOrder:
   *       type: number
   *       description: Indicate the position of the connection in the IdP selection screen
   *     formData_forceAuthn:
   *       type: boolean
   *       description: Require a new authentication instead of reusing an existing session.
   *     formData_clientIDParamPatch:
   *       type: string
   *       description: Client ID for the connection
   *     formData_clientSecretParamPatch:
   *       type: string
   *       description: Client Secret for the connection
   *     formData_tenantParamPatch:
   *       type: string
   *       description: Tenant
   *     formData_productParamPatch:
   *       type: string
   *       description: Product
   *     formData_nameParamPatch:
   *       type: string
   *       description: Name/identifier for the connection
   *     formData_labelParamPatch:
   *       type: string
   *       description: An internal label to identify the connection
   *     formData_descriptionParamPatch:
   *       type: string
   *       description: A short description for the connection not more than 100 characters
   *     formData_encodedRawMetadataParamPatch:
   *       type: string
   *       description: Base64 encoding of the XML metadata
   *     formData_rawMetadataParamPatch:
   *       type: string
   *       description: Raw XML metadata
   *     formData_metadataUrlParamPatch:
   *       type: string
   *       description: URL containing raw XML metadata
   *     formData_oidcDiscoveryUrlPatch:
   *       type: string
   *       description: well-known URL where the OpenID Provider configuration is exposed
   *     formData_oidcMetadataPatch:
   *       type: string
   *       description: metadata (JSON) for the OpenID Provider in the absence of discoveryUrl
   *     formData_oidcClientIdPatch:
   *       type: string
   *       description: clientId of the application set up on the OpenID Provider
   *     formData_oidcClientSecretPatch:
   *       type: string
   *       description: clientSecret of the application set up on the OpenID Provider
   *     formData_defaultRedirectUrlParamPatch:
   *       type: string
   *       description: The redirect URL to use in the IdP login flow
   *     formData_redirectUrlParamPatch:
   *       type: string
   *       description: JSON encoded array containing a list of allowed redirect URLs
   *     formData_deactivatedParamPatch:
   *       type: boolean
   *       description: Connection status
   *     formData_sortOrderParamPatch:
   *       type: number
   *       description: Indicate the position of the connection in the IdP selection screen
   *     formData_forceAuthnParamPatch:
   *       type: boolean
   *       description: Require a new authentication instead of reusing an existing session.
   *     formData_webhookUrlParamPost:
   *       type: string
   *       description: The URL to send the directory sync events to
   *     formData_webhookSecretParamPost:
   *       type: string
   *       description: The secret to sign the directory sync events
   *     formData_expiryDaysParamPost:
   *       type: number
   *       description: Days in number for the setup link to expire
   *       default: 3
   *     formData_regenerateParamPost:
   *       type: boolean
   *       description: If passed as true, it will remove the existing setup link and create a new one.
   *       default: false
   *     Connection:
   *       type: object
   *       properties:
   *         clientID:
   *           type: string
   *           description: Connection clientID
   *         clientSecret:
   *           type: string
   *           description: Connection clientSecret
   *         name:
   *           type: string
   *           description: Connection name
   *         label:
   *           type: string
   *           description: Connection label
   *         description:
   *           type: string
   *           description: Connection description
   *         redirectUrl:
   *           type: array
   *           items:
   *             type: string
   *           description: A list of allowed redirect URLs
   *         defaultRedirectUrl:
   *           type: string
   *           description: The redirect URL to use in the IdP login flow
   *         tenant:
   *           type: string
   *           description: Connection tenant
   *         product:
   *           type: string
   *           description: Connection product
   *         idpMetadata:
   *           type: object
   *           properties: {}
   *           description: SAML IdP metadata
   *         oidcProvider:
   *           type: object
   *           properties: {}
   *           description: OIDC IdP metadata
   *         deactivated:
   *           type: boolean
   *           description: Connection status
   *         sortOrder:
   *           type: number
   *           description: Connection sort order
   *       example:
   *         idpMetadata:
   *           sso:
   *             postUrl: https://dev-20901260.okta.com/app/dev-20901260_jacksonnext_1/xxxxxxxxxxxsso/saml
   *             redirectUrl: https://dev-20901260.okta.com/app/dev-20901260_jacksonnext_1/xxxxxxxxxxxsso/saml
   *           entityID: http://www.okta.com/xxxxxxxxxxxxx
   *           thumbprint: Eo+eUi3UM3XIMkFFtdVK3yJ5vO9f7YZdasdasdad
   *           loginType: idp
   *           provider: okta.com
   *         defaultRedirectUrl: https://hoppscotch.io/
   *         redirectUrl:
   *           - https://hoppscotch.io/
   *         tenant: hoppscotch.io
   *         product: API Engine
   *         name: Hoppscotch-SP
   *         description: SP for hoppscotch.io
   *         clientID: Xq8AJt3yYAxmXizsCWmUBDRiVP1iTC8Y/otnvFIMitk
   *         clientSecret: 00e3e11a3426f97d8000000738300009130cd45419c5943
   *         deactivated: false
   *     validationErrorsPost:
   *       description: Please provide rawMetadata or encodedRawMetadata | Please provide a defaultRedirectUrl | Please provide redirectUrl | redirectUrl is invalid | Exceeded maximum number of allowed redirect urls | defaultRedirectUrl is invalid | Please provide tenant | Please provide product | Please provide a friendly name | Description should not exceed 100 characters | Strategy&#58; xxxx not supported | Please provide the clientId from OpenID Provider | Please provide the clientSecret from OpenID Provider | Please provide the discoveryUrl for the OpenID Provider
   *     validationErrorsPatch:
   *       description: Please provide clientID | Please provide clientSecret | clientSecret mismatch | Tenant/Product config mismatch with IdP metadata | Description should not exceed 100 characters| redirectUrl is invalid | Exceeded maximum number of allowed redirect urls | defaultRedirectUrl is invalid | Tenant/Product config mismatch with OIDC Provider metadata
   *     SetupLink:
   *       type: object
   *       properties:
   *         setupID:
   *           type: string
   *           description: Setup link ID
   *         tenant:
   *           type: string
   *           description: Tenant
   *         product:
   *           type: string
   *           description: Product
   *         validTill:
   *           type: string
   *           description: Valid till timestamp
   *         url:
   *           type: string
   *           description: Setup link URL
   *       example:
   *         data:
   *           setupID: 0689f76f7b5aa22f00381a124cb4b153fc1a8c08
   *           tenant: acme
   *           product: my-app
   *           service: sso
   *           validTill: 1689849146690
   *           url: http://localhost:5225/setup/0b96a483ebfe0af0b561dda35a96647074d944631ff9e070
   *     SSOTrace:
   *       type: object
   *       properties:
   *         traceId:
   *           type: string
   *           description: Trace ID
   *         error:
   *           type: string
   *           description: Error
   *         timestamp:
   *           type: string
   *           description: Timestamp
   *         context:
   *           type: object
   *           properties:
   *             tenant:
   *               type: string
   *               description: Tenant
   *             product:
   *               type: string
   *               description: Product
   *             clientID:
   *               type: string
   *               description: Connection client ID
   *             issuer:
   *               type: string
   *               description: Issuer
   *             relayState:
   *               type: string
   *               description: Relay state
   *             samlResponse:
   *               type: string
   *               description: SAML response
   *             isSAMLFederated:
   *               type: boolean
   *               description: Indicates if SAML is federated
   *             isOIDCFederated:
   *               type: boolean
   *               description: Indicates if OIDC is federated
   *             isIdPFlow:
   *               type: boolean
   *               description: Indicates if request is from IdP
   *     Directory:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           description: Directory ID
   *         name:
   *           type: string
   *           description: name
   *         tenant:
   *           type: string
   *           description: Tenant
   *         product:
   *           type: string
   *           description: Product
   *         type:
   *           type: string
   *           description: Directory provider
   *         deactivated:
   *           type: boolean
   *           description: Status
   *         log_webhook_events:
   *           type: boolean
   *           description: If true, webhook requests will be logged
   *         scim:
   *           type: object
   *           properties:
   *             path:
   *               type: string
   *               description: SCIM path
   *             endpoint:
   *               type: string
   *               description: SCIM url
   *             secret:
   *               type: string
   *               description: SCIM secret
   *         webhook:
   *           type: object
   *           properties:
   *             endpoint:
   *               type: string
   *               description: Webhook url
   *             secret:
   *               type: string
   *               description: Webhook secret
   *     Group:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           description: Group ID
   *         name:
   *           type: string
   *           description: Group name
   *         raw:
   *           type: object
   *           properties: {}
   *           description: Raw group attributes from the Identity Provider
   *     Member:
   *       type: object
   *       properties:
   *         user_id:
   *           type: string
   *           description: ID of the user
   *     User:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           description: User ID
   *         first_name:
   *           type: string
   *           description: First name
   *         last_name:
   *           type: string
   *           description: Last name
   *         email:
   *           type: string
   *           description: Email address
   *         active:
   *           type: boolean
   *           description: Indicates whether the user is active or not
   *         raw:
   *           type: object
   *           properties: {}
   *           description: Raw user attributes from the Identity Provider
   *     Event:
   *       type: object
   *       example:
   *         id: id1
   *         webhook_endpoint: https://example.com/webhook
   *         created_at: "2024-03-05T17:06:26.074Z"
   *         status_code: 200
   *         delivered: true
   *         payload:
   *           directory_id: 58b5cd9dfaa39d47eb8f5f88631f9a629a232016
   *           event: user.created
   *           tenant: boxyhq
   *           product: jackson
   *           data:
   *             id: 038e767b-9bc6-4dbd-975e-fbc38a8e7d82
   *             first_name: Deepak
   *             last_name: Prabhakara
   *             email: deepak@boxyhq.com
   *             active: true
   *             raw:
   *               schemas:
   *                 - urn:ietf:params:scim:schemas:core:2.0:User
   *               userName: deepak@boxyhq.com
   *               name:
   *                 givenName: Deepak
   *                 familyName: Prabhakara
   *               emails:
   *                 - primary: true
   *                   value: deepak@boxyhq.com
   *                   type: work
   *               title: CEO
   *               displayName: Deepak Prabhakara
   *               locale: en-US
   *               externalId: 00u1ldzzogFkXFmvT5d7
   *               groups: []
   *               active: true
   *     IdentityFederationApp:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           description: id
   *         name:
   *           type: string
   *           description: name
   *         tenant:
   *           type: string
   *           description: Tenant
   *         product:
   *           type: string
   *           description: Product
   *         acsUrl:
   *           type: string
   *           description: ACS URL
   *         entityId:
   *           type: string
   *           description: Entity ID
   *         logoUrl:
   *           type: string
   *           description: Logo URL (optional)
   *         faviconUrl:
   *           type: string
   *           description: Favicon URL (optional)
   *         primaryColor:
   *           type: string
   *           description: Primary color (optional)
   *   responses:
   *     200Get:
   *       description: Success
   *       content:
   *         "{*}":
   *           schema:
   *             type: array
   *             items:
   *               $ref: "#/components/schemas/Connection"
   *     400Get:
   *       description: Please provide a `product`.
   *       content: {}
   *     401Get:
   *       description: Unauthorized
   *       content: {}
   *     200GetByProduct:
   *       description: Success
   *       content: {}
   *   parameters:
   *     tenantParamGet:
   *       name: tenant
   *       in: query
   *       description: Tenant
   *       required: true
   *       schema:
   *         type: string
   *     productParamGet:
   *       name: product
   *       in: query
   *       description: Product
   *       required: true
   *       schema:
   *         type: string
   *     clientIDParamGet:
   *       name: clientID
   *       in: query
   *       description: Client ID (Optional if tenant/product provided)
   *       schema:
   *         type: string
   *     strategyParamGet:
   *       name: strategy
   *       in: query
   *       description: Strategy which can help to filter connections with tenant/product query
   *       schema:
   *         type: string
   *     sortParamGet:
   *       name: sort
   *       in: query
   *       description: If present, the connections will be sorted by `sortOrder`. It won't consider if pagination is used.
   *       schema:
   *         type: string
   *     clientIDDel:
   *       name: clientID
   *       in: query
   *       description: Client ID (Optional if tenant/product provided)
   *       schema:
   *         type: string
   *     clientSecretDel:
   *       name: clientSecret
   *       in: query
   *       description: Client Secret (Optional if tenant/product provided)
   *       schema:
   *         type: string
   *     tenantDel:
   *       name: tenant
   *       in: query
   *       description: Tenant (Optional if clientID/Secret provided)
   *       schema:
   *         type: string
   *     productDel:
   *       name: product
   *       in: query
   *       description: Product (Optional if clientID/Secret provided)
   *       schema:
   *         type: string
   *     strategyDel:
   *       name: strategy
   *       in: query
   *       description: Strategy which can help to filter connections with tenant/product query
   *       schema:
   *         type: string
   *     setupLinkId:
   *       name: id
   *       in: query
   *       description: Setup link ID
   *       schema:
   *         type: string
   *     idParamGet:
   *       name: id
   *       in: query
   *       description: Setup Link ID
   *       schema:
   *         type: string
   *     tenant:
   *       name: tenant
   *       in: query
   *       description: Tenant (Optional if directoryId is provided)
   *       schema:
   *         type: string
   *     product:
   *       name: product
   *       in: query
   *       description: Product (Optional if directoryId is provided)
   *       schema:
   *         type: string
   *     directoryId:
   *       name: directoryId
   *       in: query
   *       description: Directory ID (Optional if tenant/product is provided)
   *       schema:
   *         type: string
   *     pageOffset:
   *       name: pageOffset
   *       in: query
   *       description: Starting point from which the set of records are retrieved
   *       schema:
   *         type: string
   *     pageLimit:
   *       name: pageLimit
   *       in: query
   *       description: Number of records to be fetched for the page
   *       schema:
   *         type: string
   *     pageToken:
   *       name: pageToken
   *       in: query
   *       description: Token used for DynamoDB pagination
   *       schema:
   *         type: string
   *     groupId:
   *       name: groupId
   *       in: path
   *       description: Group ID
   *       required: true
   *       schema:
   *         type: string
   *   securitySchemes:
   *     apiKey:
   *       type: apiKey
   *       name: Authorization
   *       in: header
   * /api/v1/sso:
   *   post:
   *     tags:
   *       - Single Sign-On
   *     summary: Create SSO connection
   *     operationId: create-sso-connection
   *     requestBody:
   *       content:
   *         application/x-www-form-urlencoded:
   *           schema:
   *             required:
   *               - defaultRedirectUrl
   *               - product
   *               - redirectUrl
   *               - tenant
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Name of connection
   *               label:
   *                 type: string
   *                 description: An internal label to identify the connection
   *               description:
   *                 type: string
   *                 description: A short description for the connection not more than 100 characters
   *               encodedRawMetadata:
   *                 type: string
   *                 description: Base64 encoding of the XML metadata
   *               rawMetadata:
   *                 type: string
   *                 description: Raw XML metadata
   *               metadataUrl:
   *                 type: string
   *                 description: URL containing raw XML metadata
   *               defaultRedirectUrl:
   *                 type: string
   *                 description: The redirect URL to use in the IdP login flow
   *               redirectUrl:
   *                 type: string
   *                 description: JSON encoded array containing a list of allowed redirect URLs
   *               tenant:
   *                 type: string
   *                 description: Tenant
   *               product:
   *                 type: string
   *                 description: Product
   *               oidcDiscoveryUrl:
   *                 type: string
   *                 description: well-known URL where the OpenID Provider configuration is exposed
   *               oidcMetadata:
   *                 type: string
   *                 description: metadata (JSON) for the OpenID Provider in the absence of discoveryUrl
   *               oidcClientId:
   *                 type: string
   *                 description: clientId of the application set up on the OpenID Provider
   *               oidcClientSecret:
   *                 type: string
   *                 description: clientSecret of the application set up on the OpenID Provider
   *               sortOrder:
   *                 type: number
   *                 description: Indicate the position of the connection in the IdP selection screen
   *               forceAuthn:
   *                 type: boolean
   *                 description: Require a new authentication instead of reusing an existing session.
   *         application/json:
   *           schema:
   *             required:
   *               - defaultRedirectUrl
   *               - product
   *               - redirectUrl
   *               - tenant
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Name of connection
   *               label:
   *                 type: string
   *                 description: An internal label to identify the connection
   *               description:
   *                 type: string
   *                 description: A short description for the connection not more than 100 characters
   *               encodedRawMetadata:
   *                 type: string
   *                 description: Base64 encoding of the XML metadata
   *               rawMetadata:
   *                 type: string
   *                 description: Raw XML metadata
   *               metadataUrl:
   *                 type: string
   *                 description: URL containing raw XML metadata
   *               defaultRedirectUrl:
   *                 type: string
   *                 description: The redirect URL to use in the IdP login flow
   *               redirectUrl:
   *                 type: string
   *                 description: JSON encoded array containing a list of allowed redirect URLs
   *               tenant:
   *                 type: string
   *                 description: Tenant
   *               product:
   *                 type: string
   *                 description: Product
   *               oidcDiscoveryUrl:
   *                 type: string
   *                 description: well-known URL where the OpenID Provider configuration is exposed
   *               oidcMetadata:
   *                 type: string
   *                 description: metadata (JSON) for the OpenID Provider in the absence of discoveryUrl
   *               oidcClientId:
   *                 type: string
   *                 description: clientId of the application set up on the OpenID Provider
   *               oidcClientSecret:
   *                 type: string
   *                 description: clientSecret of the application set up on the OpenID Provider
   *               sortOrder:
   *                 type: number
   *                 description: Indicate the position of the connection in the IdP selection screen
   *               forceAuthn:
   *                 type: boolean
   *                 description: Require a new authentication instead of reusing an existing session.
   *       required: true
   *     responses:
   *       "200":
   *         description: Success
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Connection"
   *       "400":
   *         $ref: "#/components/schemas/validationErrorsPost"
   *       "401":
   *         description: Unauthorized
   *         content: {}
   */
  public async createSAMLConnection(
    body: SAMLSSOConnectionWithEncodedMetadata | SAMLSSOConnectionWithRawMetadata
  ): Promise<SAMLSSORecord> {
    metrics.increment('createConnection');

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
    metrics.increment('createConnection');

    if (!this.opts.oidcPath) {
      throw new JacksonError('Please set OpenID response handler path (oidcPath) on Jackson', 500);
    }

    const connection = await oidcConnection.create(body, this.connectionStore);

    await this.eventController.notify('sso.created', connection);

    return connection;
  }

  /**
   * @openapi
   * /api/v1/sso:
   *   patch:
   *     tags:
   *       - Single Sign-On
   *     summary: Update SSO Connection
   *     operationId: update-sso-connection
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             required:
   *               - clientID
   *               - clientSecret
   *               - product
   *               - tenant
   *             type: object
   *             properties:
   *               clientID:
   *                 type: string
   *                 description: Client ID for the connection
   *               clientSecret:
   *                 type: string
   *                 description: Client Secret for the connection
   *               name:
   *                 type: string
   *                 description: Name/identifier for the connection
   *               label:
   *                 type: string
   *                 description: An internal label to identify the connection
   *               description:
   *                 type: string
   *                 description: A short description for the connection not more than 100 characters
   *               encodedRawMetadata:
   *                 type: string
   *                 description: Base64 encoding of the XML metadata
   *               rawMetadata:
   *                 type: string
   *                 description: Raw XML metadata
   *               metadataUrl:
   *                 type: string
   *                 description: URL containing raw XML metadata
   *               oidcDiscoveryUrl:
   *                 type: string
   *                 description: well-known URL where the OpenID Provider configuration is exposed
   *               oidcMetadata:
   *                 type: string
   *                 description: metadata (JSON) for the OpenID Provider in the absence of discoveryUrl
   *               oidcClientId:
   *                 type: string
   *                 description: clientId of the application set up on the OpenID Provider
   *               oidcClientSecret:
   *                 type: string
   *                 description: clientSecret of the application set up on the OpenID Provider
   *               defaultRedirectUrl:
   *                 type: string
   *                 description: The redirect URL to use in the IdP login flow
   *               redirectUrl:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: JSON encoded array containing a list of allowed redirect URLs
   *               tenant:
   *                 type: string
   *                 description: Tenant
   *               product:
   *                 type: string
   *                 description: Product
   *               deactivated:
   *                 type: boolean
   *                 description: Connection status
   *               sortOrder:
   *                 type: number
   *                 description: Indicate the position of the connection in the IdP selection screen
   *               forceAuthn:
   *                 type: boolean
   *                 description: Require a new authentication instead of reusing an existing session.
   *         application/x-www-form-urlencoded:
   *           schema:
   *             required:
   *               - clientID
   *               - clientSecret
   *               - product
   *               - tenant
   *             type: object
   *             properties:
   *               clientID:
   *                 type: string
   *                 description: Client ID for the connection
   *               clientSecret:
   *                 type: string
   *                 description: Client Secret for the connection
   *               name:
   *                 type: string
   *                 description: Name/identifier for the connection
   *               label:
   *                 type: string
   *                 description: An internal label to identify the connection
   *               description:
   *                 type: string
   *                 description: A short description for the connection not more than 100 characters
   *               encodedRawMetadata:
   *                 type: string
   *                 description: Base64 encoding of the XML metadata
   *               rawMetadata:
   *                 type: string
   *                 description: Raw XML metadata
   *               metadataUrl:
   *                 type: string
   *                 description: URL containing raw XML metadata
   *               oidcDiscoveryUrl:
   *                 type: string
   *                 description: well-known URL where the OpenID Provider configuration is exposed
   *               oidcMetadata:
   *                 type: string
   *                 description: metadata (JSON) for the OpenID Provider in the absence of discoveryUrl
   *               oidcClientId:
   *                 type: string
   *                 description: clientId of the application set up on the OpenID Provider
   *               oidcClientSecret:
   *                 type: string
   *                 description: clientSecret of the application set up on the OpenID Provider
   *               defaultRedirectUrl:
   *                 type: string
   *                 description: The redirect URL to use in the IdP login flow
   *               redirectUrl:
   *                 type: string
   *                 description: JSON encoded array containing a list of allowed redirect URLs
   *               tenant:
   *                 type: string
   *                 description: Tenant
   *               product:
   *                 type: string
   *                 description: Product
   *               deactivated:
   *                 type: boolean
   *                 description: Connection status
   *               sortOrder:
   *                 type: number
   *                 description: Indicate the position of the connection in the IdP selection screen
   *               forceAuthn:
   *                 type: boolean
   *                 description: Require a new authentication instead of reusing an existing session.
   *       required: true
   *     responses:
   *       "204":
   *         description: Success
   *         content: {}
   *       "400":
   *         $ref: "#/components/schemas/validationErrorsPatch"
   *       "401":
   *         description: Unauthorized
   *         content: {}
   *       "500":
   *         description: Please set OpenID response handler path (oidcPath) on Jackson
   *         content: {}
   */
  public async updateSAMLConnection(body: UpdateSAMLConnectionParams): Promise<void> {
    const connection = await samlConnection.update(
      body,
      this.connectionStore,
      this.getConnections.bind(this)
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
      this.getConnections.bind(this)
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
   * @openapi
   * /api/v1/sso:
   *   get:
   *     tags:
   *       - Single Sign-On
   *     summary: Get SSO Connections
   *     operationId: get-connections
   *     parameters:
   *       - name: tenant
   *         in: query
   *         description: Tenant
   *         required: true
   *         schema:
   *           type: string
   *       - name: product
   *         in: query
   *         description: Product
   *         required: true
   *         schema:
   *           type: string
   *       - name: clientID
   *         in: query
   *         description: Client ID (Optional if tenant/product provided)
   *         schema:
   *           type: string
   *       - name: strategy
   *         in: query
   *         description: Strategy which can help to filter connections with tenant/product query
   *         schema:
   *           type: string
   *       - name: sort
   *         in: query
   *         description: If present, the connections will be sorted by `sortOrder`. It won't consider if pagination is used.
   *         schema:
   *           type: string
   *     responses:
   *       "200":
   *         description: Success
   *         content:
   *           "{*}":
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Connection"
   *       "400":
   *         description: Please provide a `product`.
   *         content: {}
   *       "401":
   *         description: Unauthorized
   *         content: {}
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
   * @openapi
   * /api/v1/sso:
   *   delete:
   *     tags:
   *       - Single Sign-On
   *     summary: Delete SSO Connections
   *     operationId: delete-sso-connection
   *     parameters:
   *       - name: clientID
   *         in: query
   *         description: Client ID (Optional if tenant/product provided)
   *         schema:
   *           type: string
   *       - name: clientSecret
   *         in: query
   *         description: Client Secret (Optional if tenant/product provided)
   *         schema:
   *           type: string
   *       - name: tenant
   *         in: query
   *         description: Tenant (Optional if clientID/Secret provided)
   *         schema:
   *           type: string
   *       - name: product
   *         in: query
   *         description: Product (Optional if clientID/Secret provided)
   *         schema:
   *           type: string
   *       - name: strategy
   *         in: query
   *         description: Strategy which can help to filter connections with tenant/product query
   *         schema:
   *           type: string
   *     responses:
   *       "200":
   *         description: Success
   *         content: {}
   *       "400":
   *         description: clientSecret mismatch | Please provide `clientID` and `clientSecret` or `tenant` and `product`.
   *         content: {}
   *       "401":
   *         description: Unauthorized
   *         content: {}
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
   * @openapi
   * /api/v1/sso/product:
   *   get:
   *     tags:
   *       - Single Sign-On
   *     summary: Get SSO Connections by product
   *     operationId: get-connections-by-product
   *     parameters:
   *       - name: product
   *         in: query
   *         description: Product
   *         required: true
   *         schema:
   *           type: string
   *       - name: pageOffset
   *         in: query
   *         description: Starting point from which the set of records are retrieved
   *         schema:
   *           type: string
   *       - name: pageLimit
   *         in: query
   *         description: Number of records to be fetched for the page
   *         schema:
   *           type: string
   *       - name: pageToken
   *         in: query
   *         description: Token used for DynamoDB pagination
   *         schema:
   *           type: string
   *     responses:
   *       "200":
   *         description: Success
   *         content: {}
   *       "400":
   *         description: Please provide a `product`.
   *         content: {}
   *       "401":
   *         description: Unauthorized
   *         content: {}
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
