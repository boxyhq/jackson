import type {
  Storable,
  JacksonOption,
  SAMLFederationApp,
  Records,
  GetByProductParams,
  AppRequestParams,
} from '../../typings';
import { appID } from '../../controller/utils';
import { createMetadataXML } from '../../saml/lib';
import { JacksonError } from '../../controller/error';
import { getDefaultCertificate } from '../../saml/x509';
import { IndexNames, validateTenantAndProduct } from '../../controller/utils';
import { throwIfInvalidLicense } from '../common/checkLicense';

type NewAppParams = Pick<SAMLFederationApp, 'name' | 'tenant' | 'product' | 'acsUrl' | 'entityId'> & {
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
   *     summary: Create a SAML Federation app
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
   *     tags: [SAML Federation]
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
    tenant,
    product,
    acsUrl,
    entityId,
    logoUrl,
    faviconUrl,
    primaryColor,
  }: NewAppParams) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if (!tenant || !product || !acsUrl || !entityId || !name) {
      throw new JacksonError(
        'Missing required parameters. Required parameters are: name, tenant, product, acsUrl, entityId',
        400
      );
    }

    validateTenantAndProduct(tenant, product);

    const id = appID(tenant, product);

    const foundApp = await this.store.get(id);

    if (foundApp) {
      throw new JacksonError('An app is already created with the same tenant and product.', 400);
    }

    const app: SAMLFederationApp = {
      id,
      name,
      tenant,
      product,
      acsUrl,
      entityId,
      logoUrl: logoUrl || null,
      faviconUrl: faviconUrl || null,
      primaryColor: primaryColor || null,
    };

    await this.store.put(
      id,
      app,
      {
        name: IndexNames.EntityID,
        value: entityId,
      },
      {
        name: IndexNames.Product,
        value: product,
      }
    );

    return app;
  }

  /**
   * @swagger
   * /api/v1/federated-saml:
   *   get:
   *     summary: Get a SAML Federation app
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
   *       - SAML Federation
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
        throw new JacksonError('SAML Federation app not found', 404);
      }

      return app as SAMLFederationApp;
    }

    if ('tenant' in params && 'product' in params) {
      const app = await this.store.get(appID(params.tenant, params.product));

      if (!app) {
        throw new JacksonError('SAML Federation app not found', 404);
      }

      return app as SAMLFederationApp;
    }

    throw new JacksonError('Provide either the `id` or `tenant` and `product` to get the app', 400);
  }

  /**
   * @swagger
   * /api/v1/federated-saml/product:
   *   get:
   *     summary: Get SAML Federation apps by product
   *     parameters:
   *       - name: product
   *         description: Product
   *         in: query
   *         required: true
   *         type: string
   *     tags:
   *       - SAML Federation
   *     produces:
   *       - application/json
   *     responses:
   *        200:
   *          description: Success
   *          schema:
   *            type: array
   *            items:
   *              $ref:  '#/definitions/SAMLFederationApp'
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
      throw new JacksonError('SAML Federation app not found', 404);
    }

    return apps[0];
  }

  /**
   * @swagger
   * /api/v1/federated-saml:
   *   patch:
   *     summary: Update a SAML Federation app
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
   *     tags:
   *       - SAML Federation
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

    const { id, tenant, product } = params;

    if (!id && (!tenant || !product)) {
      throw new JacksonError('Provide either the `id` or `tenant` and `product` to update the app', 400);
    }

    let app: null | SAMLFederationApp = null;

    if (id) {
      app = await this.get({ id });
    } else if (tenant && product) {
      app = await this.get({ tenant, product });
    }

    if (!app) {
      throw new JacksonError('SAML Federation app not found', 404);
    }

    const toUpdate: Partial<SAMLFederationApp> = {};

    // Support partial updates

    if ('name' in params) {
      toUpdate['name'] = params.name;
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
   *     summary: Delete a SAML Federation app
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
   *       - SAML Federation
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
      const id = appID(params.tenant, params.product);
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

    const xml = await createMetadataXML({
      entityId,
      ssoUrl,
      x509cert: publicKey,
    });

    return {
      xml,
      entityId,
      ssoUrl,
      x509cert: publicKey,
    };
  }
}
