import type { ApiError, SAMLFederationApp, Storable } from '../typings';
import * as dbutils from '../db/utils';

export class App {
  protected store: Storable;

  constructor({ store }: { store: Storable }) {
    this.store = store;
  }

  // Create a new app
  public async create({
    tenant,
    product,
    acsUrl,
    entityId,
  }: Omit<SAMLFederationApp, 'id'>): Promise<{ data: SAMLFederationApp | null; error: ApiError | null }> {
    if (!tenant || !product || !acsUrl || !entityId) {
      return {
        data: null,
        error: {
          code: 400,
          message: 'Missing required parameters. Required parameters are: tenant, product, acsUrl, entityId',
        },
      };
    }

    const id = dbutils.keyDigest(dbutils.keyFromParts(tenant, product));

    const app = {
      id,
      tenant,
      product,
      acsUrl,
      entityId,
    };

    await this.store.put(id, app);

    return { data: app, error: null };
  }

  // Update the app
  public async update(
    id: string,
    { tenant, product, acsUrl, entityId }: Partial<Omit<SAMLFederationApp, 'id'>>
  ): Promise<{ data: SAMLFederationApp | null; error: ApiError | null }> {
    if (!id || !tenant || !product || !acsUrl || !entityId) {
      return {
        data: null,
        error: {
          code: 400,
          message:
            'Missing required parameters. Required parameters are: id, tenant, product, acsUrl, entityId',
        },
      };
    }

    const app: SAMLFederationApp = await this.store.get(id);

    if (!app) {
      return {
        data: null,
        error: {
          code: 404,
          message: 'SAML Federation App not found',
        },
      };
    }

    const updatedApp = {
      ...app,
      tenant: tenant || app.tenant,
      product: product || app.product,
      acsUrl: acsUrl || app.acsUrl,
      entityId: entityId || app.entityId,
    };

    await this.store.put(id, updatedApp);

    return { data: updatedApp, error: null };
  }

  // Get an app by tenant and product
  public async get(id: string): Promise<{ data: SAMLFederationApp | null; error: ApiError | null }> {
    if (!id) {
      return {
        data: null,
        error: {
          code: 400,
          message: 'Missing required parameters. Required parameters are: id',
        },
      };
    }

    const app: SAMLFederationApp = await this.store.get(id);

    if (!app) {
      return {
        data: null,
        error: {
          code: 404,
          message: 'SAML Federation App not found',
        },
      };
    }

    return { data: app, error: null };
  }

  // Get all apps
  public async getAll(): Promise<{ data: SAMLFederationApp[] | null; error: ApiError | null }> {
    try {
      const app = (await this.store.getAll()) as SAMLFederationApp[];

      return { data: app, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          code: 500,
          message: error.message,
        },
      };
    }
  }

  // Delete the app
  public async delete(id: string): Promise<{ data: null; error: ApiError | null }> {
    if (!id) {
      return {
        data: null,
        error: {
          code: 400,
          message: 'Missing required parameters. Required parameters are: id',
        },
      };
    }

    const app: SAMLFederationApp = await this.store.get(id);

    if (!app) {
      return {
        data: null,
        error: {
          code: 404,
          message: 'SAML Federation App not found',
        },
      };
    }

    return { data: null, error: null };
  }
}
