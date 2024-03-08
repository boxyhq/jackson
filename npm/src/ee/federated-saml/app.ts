import crypto from 'crypto';
import saml from '@boxyhq/saml20';

import type {
  Storable,
  JacksonOption,
  SAMLFederationApp,
  Records,
  GetByProductParams,
  AppRequestParams,
} from '../../typings';
import { fedAppID, clientIDFederatedPrefix } from '../../controller/utils';
import { JacksonError } from '../../controller/error';
import { getDefaultCertificate } from '../../saml/x509';
import { IndexNames, validateTenantAndProduct } from '../../controller/utils';
import { throwIfInvalidLicense } from '../common/checkLicense';

type NewAppParams = Pick<
  SAMLFederationApp,
  'name' | 'tenant' | 'product' | 'acsUrl' | 'entityId' | 'tenants' | 'mappings' | 'type' | 'redirectUrl'
> & {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
};

export class App {
  protected store: Storable;
  private opts: JacksonOption;

  /**
   * @swagger
   * definitions:
   *   SAMLFederationApp:
   *      type: object
   *      properties:
   *        id:
   *          type: string
   *          description: id
   *        name:
   *          type: string
   *          description: name
   *        tenant:
   *          type: string
   *          description: Tenant
   *        product:
   *          type: string
   *          description: Product
   *        acsUrl:
   *          type: string
   *          description: ACS URL
   *        entityId:
   *          type: string
   *          description: Entity ID
   *        logoUrl:
   *          type: string
   *          description: Logo URL (optional)
   *        faviconUrl:
   *          type: string
   *          description: Favicon URL (optional)
   *        primaryColor:
   *          type: string
   *          description: Primary color (optional)
   */

  constructor({ store, opts }: { store: Storable; opts: JacksonOption }) {
    this.store = store;
    this.opts = opts;
  }

  /**
   * @swagger
   * /api/v1/federated-saml:
   *   post:
   *     summary: Create an Identity Federation app
   *     parameters:
   *       - name: name
   *         description: Name
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
   *       - name: acsUrl
   *         description: ACS URL
   *         in: formData
   *         required: true
   *         type: string
   *       - name: entityId
   *         description: Entity ID
   *         in: formData
   *         required: true
   *         type: string
   *       - name: logoUrl
   *         description: Logo URL
   *         in: formData
   *         required: false
   *         type: string
   *       - name: faviconUrl
   *         description: Favicon URL
   *         in: formData
   *         required: false
   *         type: string
   *       - name: primaryColor
   *         description: Primary color
   *         in: formData
   *         required: false
   *         type: string
   *       - name: tenants
   *         description: Mapping of tenants whose connections will be grouped under this Identity Federation app
   *         in: formData
   *         required: false
   *         type: array
   *       - name: mappings
   *         description: Mapping of attributes from the IdP to SP
   *         in: formData
   *         required: false
   *         type: array
   *       - name: type
   *         description: If creating an OIDC app, this should be set to 'oidc' otherwise it defaults to 'saml'
   *         in: formData
   *         required: false
   *         type: array
   *       - name: redirectUrl
   *         description: If creating an OIDC app, provide the redirect URL
   *         in: formData
   *         required: false
   *         type: array
   *     tags: [Identity Federation]
   *     produces:
   *      - application/json
   *     consumes:
   *      - application/x-www-form-urlencoded
   *      - application/json
   *     responses:
   *      200:
   *        description: Success
   *        schema:
   *          type: array
   *          items:
   *            $ref:  '#/definitions/SAMLFederationApp'
   */
  public async create({
    name,
    type,
    redirectUrl,
    tenant,
    product,
    acsUrl,
    entityId,
    logoUrl,
    faviconUrl,
    primaryColor,
    tenants,
    mappings,
  }: NewAppParams) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if (type === 'oidc') {
      if (!tenant || !product || !redirectUrl || !name) {
        throw new JacksonError(
          'Missing required parameters. Required parameters are: name, tenant, product, redirectUrl',
          400
        );
      }
    } else {
      if (!tenant || !product || !acsUrl || !entityId || !name) {
        throw new JacksonError(
          'Missing required parameters. Required parameters are: name, tenant, product, acsUrl, entityId',
          400
        );
      }
    }

    validateTenantAndProduct(tenant, product);

    const id = fedAppID(tenant, product, type);

    // Check if an app already exists for the same tenant and product
    const foundApp = await this.store.get(id);

    if (foundApp) {
      throw new JacksonError(
        'Cannot create another app for the same tenant and product. An app already exists.',
        400
      );
    }

    // Check if an app already exists with the same entityId
    const result = await this.store.getByIndex({
      name: IndexNames.EntityID,
      value: entityId,
    });

    const apps: SAMLFederationApp[] = result.data;

    if (apps && apps.length > 0) {
      throw new JacksonError(
        `An app already exists with the same Entity ID. Provide a unique Entity ID and try again.`,
        400
      );
    }

    let _tenants: string[] = [];

    if (tenants && tenants.length > 0) {
      _tenants = tenants.filter((t) => t !== tenant);
      _tenants.unshift(tenant);
    } else {
      _tenants.push(tenant);
    }

    const app: SAMLFederationApp = {
      id,
      type,
      redirectUrl,
      name,
      tenant,
      product,
      acsUrl,
      entityId,
      logoUrl: logoUrl || null,
      faviconUrl: faviconUrl || null,
      primaryColor: primaryColor || null,
      tenants: _tenants,
      mappings: mappings || [],
    };

    if (type === 'oidc') {
      app.clientID = `${clientIDFederatedPrefix}${id}`;
      app.clientSecret = crypto.randomBytes(24).toString('hex');
    }

    const indexes = [
      {
        name: IndexNames.Product,
        value: product,
      },
    ];

    if (type !== 'oidc') {
      indexes.push({
        name: IndexNames.EntityID,
        value: entityId,
      });
    }

    await this.store.put(id, app, ...indexes);

    return app;
  }

  /**
   * @swagger
   * /api/v1/federated-saml:
   *   get:
   *     summary: Get an Identity Federation app
   *     parameters:
   *       - name: id
   *         description: App ID
   *         in: query
   *         required: true
   *         type: string
   *       - name: tenant
   *         description: Tenant
   *         in: query
   *         required: false
   *         type: string
   *       - name: product
   *         description: Product
   *         in: query
   *         required: false
   *         type: string
   *     tags:
   *       - Identity Federation
   *     produces:
   *       - application/json
   *     responses:
   *       '200':
   *         description: Success
   *         schema:
   *           $ref: '#/definitions/SAMLFederationApp'
   */
  public async get(params: AppRequestParams) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if ('id' in params) {
      const app = await this.store.get(params.id);

      if (!app) {
        throw new JacksonError('Identity Federation app not found', 404);
      }

      return app as SAMLFederationApp;
    }

    if ('tenant' in params && 'product' in params) {
      const app = await this.store.get(fedAppID(params.tenant, params.product, params.type));

      if (!app) {
        throw new JacksonError('Identity Federation app not found', 404);
      }

      return app as SAMLFederationApp;
    }

    throw new JacksonError('Provide either the `id` or `tenant` and `product` to get the app', 400);
  }

  /**
   * @swagger
   * /api/v1/federated-saml/product:
   *   get:
   *     summary: Get Identity Federation apps by product
   *     parameters:
   *       - name: product
   *         description: Product
   *         in: query
   *         required: true
   *         type: string
   *       - $ref: '#/parameters/pageOffset'
   *       - $ref: '#/parameters/pageLimit'
   *       - $ref: '#/parameters/pageToken'
   *     tags:
   *       - Identity Federation
   *     produces:
   *       - application/json
   *     responses:
   *        200:
   *          description: Success
   *          content:
   *            application/json:
   *               schema:
   *                 type: object
   *                 properties:
   *                   data:
   *                     type: array
   *                     items:
   *                       $ref: '#/definitions/SAMLFederationApp'
   *                   pageToken:
   *                     type: string
   *                     description: token for pagination
   */
  public async getByProduct({ product, pageOffset, pageLimit, pageToken }: GetByProductParams) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if (!product) {
      throw new JacksonError('Please provide a `product`.', 400);
    }

    const apps = await this.store.getByIndex(
      {
        name: IndexNames.Product,
        value: product,
      },
      pageOffset,
      pageLimit,
      pageToken
    );

    return apps;
  }

  // Get the app by SP EntityId
  public async getByEntityId(entityId: string) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if (!entityId) {
      throw new JacksonError('Missing required parameters. Required parameters are: entityId', 400);
    }

    const apps: SAMLFederationApp[] = (
      await this.store.getByIndex({
        name: IndexNames.EntityID,
        value: entityId,
      })
    ).data;

    if (!apps || apps.length === 0) {
      throw new JacksonError('Identity Federation app not found', 404);
    }

    return apps[0];
  }

  /**
   * @swagger
   * /api/v1/federated-saml:
   *   patch:
   *     summary: Update an Identity Federation app
   *     parameters:
   *       - name: id
   *         description: App ID
   *         in: formData
   *         required: true
   *         type: string
   *       - name: tenant
   *         description: Tenant
   *         in: formData
   *         required: false
   *         type: string
   *       - name: product
   *         description: Product
   *         in: formData
   *         required: false
   *         type: string
   *       - name: name
   *         description: Name
   *         in: formData
   *         required: false
   *         type: string
   *       - name: acsUrl
   *         description: ACS URL
   *         in: formData
   *         required: false
   *         type: string
   *       - name: logoUrl
   *         description: Logo URL
   *         in: formData
   *         required: false
   *         type: string
   *       - name: faviconUrl
   *         description: Favicon URL
   *         in: formData
   *         required: false
   *         type: string
   *       - name: primaryColor
   *         description: Primary color
   *         in: formData
   *         required: false
   *         type: string
   *       - name: tenants
   *         description: Mapping of tenants whose connections will be grouped under this Identity Federation app
   *         in: formData
   *         required: false
   *         type: array
   *       - name: mappings
   *         description: Mapping of attributes from the IdP to SP
   *         in: formData
   *         required: false
   *         type: array
   *     tags:
   *       - Identity Federation
   *     produces:
   *       - application/json
   *     consumes:
   *      - application/x-www-form-urlencoded
   *      - application/json
   *     responses:
   *       '200':
   *         description: Success
   *         schema:
   *           $ref: '#/definitions/SAMLFederationApp'
   */
  public async update(params: Partial<SAMLFederationApp>) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const { id, tenant, product, type } = params;

    if (!id && (!tenant || !product)) {
      throw new JacksonError('Provide either the `id` or `tenant` and `product` to update the app', 400);
    }

    let app: null | SAMLFederationApp = null;

    if (id) {
      app = await this.get({ id });
    } else if (tenant && product) {
      app = await this.get({ tenant, product, type });
    }

    if (!app) {
      throw new JacksonError('Identity Federation app not found', 404);
    }

    const toUpdate: Partial<SAMLFederationApp> = {};

    // Support partial updates

    if ('name' in params) {
      toUpdate['name'] = params.name;
    }

    if ('redirectUrl' in params) {
      toUpdate['redirectUrl'] = params.redirectUrl;
    }

    if ('acsUrl' in params) {
      toUpdate['acsUrl'] = params.acsUrl;
    }

    if ('logoUrl' in params) {
      toUpdate['logoUrl'] = params.logoUrl || null;
    }

    if ('faviconUrl' in params) {
      toUpdate['faviconUrl'] = params.faviconUrl || null;
    }

    if ('primaryColor' in params) {
      toUpdate['primaryColor'] = params.primaryColor || null;
    }

    if ('tenants' in params) {
      let _tenants: string[] = [];

      if (params.tenants && params.tenants.length > 0) {
        _tenants = params.tenants.filter((t) => t !== app?.tenant);
        _tenants.unshift(app.tenant);
      } else {
        _tenants.push(app.tenant);
      }

      toUpdate['tenants'] = _tenants;
    }

    if ('mappings' in params) {
      toUpdate['mappings'] = params.mappings;
    }

    if (Object.keys(toUpdate).length === 0) {
      throw new JacksonError(
        'Please provide at least one of the following parameters: acsUrl, name, logoUrl, faviconUrl, primaryColor',
        400
      );
    }

    const updatedApp = {
      ...app,
      ...toUpdate,
    };

    await this.store.put(app.id, updatedApp);

    return updatedApp;
  }

  // Get all apps
  public async getAll({
    pageOffset,
    pageLimit,
    pageToken,
  }: {
    pageOffset?: number;
    pageLimit?: number;
    pageToken?: string;
  }) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const apps = (await this.store.getAll(pageOffset, pageLimit, pageToken)) as Records<SAMLFederationApp>;

    return apps;
  }

  /**
   * @swagger
   * /api/v1/federated-saml:
   *   delete:
   *     summary: Delete an Identity Federation app
   *     parameters:
   *       - name: id
   *         description: App ID
   *         in: query
   *         required: true
   *         type: string
   *       - name: tenant
   *         description: Tenant
   *         in: query
   *         required: false
   *         type: string
   *       - name: product
   *         description: Product
   *         in: query
   *         required: false
   *         type: string
   *     tags:
   *       - Identity Federation
   *     produces:
   *       - application/json
   *     responses:
   *       '200':
   *         description: Success
   *         schema:
   *           $ref: '#/definitions/SAMLFederationApp'
   */
  public async delete(params: AppRequestParams): Promise<void> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if ('id' in params) {
      return await this.store.delete(params.id);
    }

    if ('tenant' in params && 'product' in params) {
      const id = fedAppID(params.tenant, params.product, params.type);
      return await this.store.delete(id);
    }

    throw new JacksonError('Provide either the `id` or `tenant` and `product` to delete the app', 400);
  }

  // Get the metadata for the app
  public async getMetadata() {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const { publicKey } = await getDefaultCertificate();

    const ssoUrl = `${this.opts.externalUrl}/api/federated-saml/sso`;
    const entityId = `${this.opts.samlAudience}`;

    const xml = saml.createIdPMetadataXML({
      entityId,
      ssoUrl,
      x509cert: publicKey,
      wantAuthnRequestsSigned: false,
    });

    return {
      xml,
      entityId,
      ssoUrl,
      x509cert: publicKey,
    };
  }
}
