import type { SAMLFederationApp, SAMLFederationAppWithMetadata, Storable } from '../typings';
import * as dbutils from '../db/utils';
import { createMetadataXML } from './utils';
import { getDefaultCertificate } from '../saml/x509';
import { JacksonError } from '../controller/error';

type IdPMetadata = Pick<SAMLFederationAppWithMetadata, 'metadata'>['metadata'];

export class App {
  protected store: Storable;

  constructor({ store }: { store: Storable }) {
    this.store = store;
  }

  // Create a new app
  public async create({ tenant, product, acsUrl, entityId }: Omit<SAMLFederationApp, 'id'>): Promise<{
    data: SAMLFederationApp | null;
  }> {
    if (!tenant || !product || !acsUrl || !entityId) {
      throw new JacksonError(
        'Missing required parameters. Required parameters are: tenant, product, acsUrl, entityId',
        400
      );
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

    return { data: app };
  }

  // Get an app by tenant and product
  public async get(id: string): Promise<{ data: SAMLFederationApp }> {
    if (!id) {
      throw new JacksonError('Missing required parameters. Required parameters are: id', 400);
    }

    const app: SAMLFederationApp = await this.store.get(id);

    if (!app) {
      throw new JacksonError('SAML Federation app not found', 404);
    }

    return { data: app };
  }

  // Update the app
  public async update(
    id: string,
    { tenant, product, acsUrl, entityId }: Partial<Omit<SAMLFederationApp, 'id'>>
  ): Promise<{ data: SAMLFederationApp | null }> {
    if (!id || !tenant || !product || !acsUrl || !entityId) {
      throw new JacksonError(
        'Missing required parameters. Required parameters are: id, tenant, product, acsUrl, entityId',
        400
      );
    }

    const { data: app } = await this.get(id);

    const updatedApp = {
      ...app,
      tenant: tenant || app.tenant,
      product: product || app.product,
      acsUrl: acsUrl || app.acsUrl,
      entityId: entityId || app.entityId,
    };

    await this.store.put(id, updatedApp);

    return { data: updatedApp };
  }

  // Get all apps
  public async getAll(): Promise<{ data: SAMLFederationApp[] | null }> {
    const apps = (await this.store.getAll()) as SAMLFederationApp[];

    return { data: apps };
  }

  // Delete the app
  public async delete(id: string): Promise<{ data: null }> {
    if (!id) {
      throw new JacksonError('Missing required parameters. Required parameters are: id', 400);
    }

    await this.get(id);
    await this.store.delete(id);

    return { data: null };
  }

  // Get the metadata for the app
  public async getMetadata(id: string): Promise<{ data: IdPMetadata }> {
    await this.get(id);

    const { publicKey } = await getDefaultCertificate();

    const baseUrl = 'https://f4d4-103-147-208-109.in.ngrok.io';
    const ssoUrl = `${baseUrl}/api/saml-federation/${id}/sso`;
    const entityId = 'https://saml.boxyhq.com';

    const xml = await createMetadataXML({
      entityId,
      ssoUrl,
      x509cert: publicKey,
    });

    return {
      data: {
        xml,
        entityId,
        ssoUrl,
        x509cert: publicKey,
      },
    };
  }
}
