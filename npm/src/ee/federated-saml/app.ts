import type { Storable, JacksonOption, SAMLFederationApp, Records } from '../../typings';
import { appID } from '../../controller/utils';
import { createMetadataXML } from '../../saml/lib';
import { JacksonError } from '../../controller/error';
import { getDefaultCertificate } from '../../saml/x509';
import { IndexNames, validateTenantAndProduct } from '../../controller/utils';
import { throwIfInvalidLicense } from '../common/checkLicense';

type NewAppParams = Pick<SAMLFederationApp, 'name' | 'tenant' | 'product' | 'acsUrl' | 'entityId'>;

export class App {
  protected store: Storable;
  private opts: JacksonOption;

  constructor({ store, opts }: { store: Storable; opts: JacksonOption }) {
    this.store = store;
    this.opts = opts;
  }

  // Create a new SAML Federation app for the tenant and product
  public async create({ name, tenant, product, acsUrl, entityId }: NewAppParams) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if (!tenant || !product || !acsUrl || !entityId || !name) {
      throw new JacksonError(
        'Missing required parameters. Required parameters are: name, tenant, product, acsUrl, entityId',
        400
      );
    }

    validateTenantAndProduct(tenant, product);

    const id = appID(tenant, product);

    const app: SAMLFederationApp = {
      id,
      name,
      tenant,
      product,
      acsUrl,
      entityId,
      logoUrl: null,
      faviconUrl: null,
      primaryColor: null,
    };

    await this.store.put(id, app, {
      name: IndexNames.EntityID,
      value: entityId,
    });

    return app;
  }

  // Get an app by tenant and product
  public async get(id: string) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if (!id) {
      throw new JacksonError('Missing required parameters. Required parameters are: id', 400);
    }

    const app: SAMLFederationApp = await this.store.get(id);

    if (!app) {
      throw new JacksonError('SAML Federation app not found', 404);
    }

    return app;
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

  // Update the app
  public async update(id: string, params: Partial<Omit<SAMLFederationApp, 'id'>>) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const { acsUrl, entityId, name, logoUrl, faviconUrl, primaryColor } = params;

    if (!id) {
      throw new JacksonError('Missing the app id', 400);
    }

    if (!acsUrl && !entityId && !name && !logoUrl && !faviconUrl && !primaryColor) {
      throw new JacksonError(
        'Missing required parameters. Please provide at least one of the following parameters: acsUrl, entityId, name, logoUrl, faviconUrl, primaryColor',
        400
      );
    }

    const app = await this.get(id);

    const updatedApp: SAMLFederationApp = {
      ...app,
      name: name || app.name,
      acsUrl: acsUrl || app.acsUrl,
      entityId: entityId || app.entityId,
      logoUrl: logoUrl || app.logoUrl,
      faviconUrl: faviconUrl || app.faviconUrl,
      primaryColor: primaryColor || app.primaryColor,
    };

    await this.store.put(id, updatedApp);

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

  // Delete the app
  public async delete(id: string): Promise<void> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if (!id) {
      throw new JacksonError('Missing required parameters. Required parameters are: id', 400);
    }

    await this.get(id);
    await this.store.delete(id);

    return;
  }

  // Get the metadata for the app
  public async getMetadata() {
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
