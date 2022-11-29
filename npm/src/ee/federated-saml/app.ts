import { getDefaultCertificate } from '../../saml/x509';
import { JacksonError } from '../../controller/error';
import { IndexNames } from '../../controller/utils';
import { createMetadataXML } from '../../saml/lib';
import * as dbutils from '../../db/utils';
import type { Storable, JacksonOption } from '../../typings';
import type { SAMLFederationAppWithMetadata, SAMLFederationApp } from './types';

export class App {
  protected store: Storable;
  private opts: JacksonOption;

  constructor({ store, opts }: { store: Storable; opts: JacksonOption }) {
    this.store = store;
    this.opts = opts;
  }

  // Create a new SAML Federation app for the tenant and product
  public async create({
    name,
    tenant,
    product,
    acsUrl,
    entityId,
  }: Omit<SAMLFederationApp, 'id'>): Promise<SAMLFederationApp> {
    if (!tenant || !product || !acsUrl || !entityId || !name) {
      throw new JacksonError(
        'Missing required parameters. Required parameters are: name, tenant, product, acsUrl, entityId',
        400
      );
    }

    const id = dbutils.keyDigest(dbutils.keyFromParts(tenant, product));

    const app = {
      id,
      name,
      tenant,
      product,
      acsUrl,
      entityId,
    };

    await this.store.put(id, app, {
      name: IndexNames.EntityID,
      value: entityId,
    });

    return { ...app };
  }

  // Get an app by tenant and product
  public async get(id: string): Promise<SAMLFederationApp> {
    if (!id) {
      throw new JacksonError('Missing required parameters. Required parameters are: id', 400);
    }

    const app: SAMLFederationApp = await this.store.get(id);

    if (!app) {
      throw new JacksonError('SAML Federation app not found', 404);
    }

    return { ...app };
  }

  // Get the app by SP EntityId
  public async getByEntityId(entityId: string): Promise<SAMLFederationApp> {
    if (!entityId) {
      throw new JacksonError('Missing required parameters. Required parameters are: entityId', 400);
    }

    const apps: SAMLFederationApp[] = await this.store.getByIndex({
      name: IndexNames.EntityID,
      value: entityId,
    });

    if (!apps || apps.length === 0) {
      throw new JacksonError('SAML Federation app not found', 404);
    }

    return { ...apps[0] };
  }

  // Update the app
  public async update(
    id: string,
    { acsUrl, entityId, name }: Partial<Omit<SAMLFederationApp, 'id'>>
  ): Promise<SAMLFederationApp> {
    if (!id && (!acsUrl || !entityId || !name)) {
      throw new JacksonError(
        "Missing required parameters. Required parameters are: id, acsUrl, entityId, name'",
        400
      );
    }

    const app = await this.get(id);

    const updatedApp = {
      ...app,
      name: name || app.name,
      acsUrl: acsUrl || app.acsUrl,
      entityId: entityId || app.entityId,
    };

    await this.store.put(id, updatedApp);

    return { ...updatedApp };
  }

  // Get all apps
  public async getAll(): Promise<SAMLFederationApp[]> {
    const apps = (await this.store.getAll()) as SAMLFederationApp[];

    return apps.map((app) => ({ ...app }));
  }

  // Delete the app
  public async delete(id: string): Promise<void> {
    if (!id) {
      throw new JacksonError('Missing required parameters. Required parameters are: id', 400);
    }

    await this.get(id);
    await this.store.delete(id);

    return;
  }

  // Get the metadata for the app
  public async getMetadata(id: string): Promise<Pick<SAMLFederationAppWithMetadata, 'metadata'>['metadata']> {
    // TODO: Fix the entityID

    const app = await this.get(id);

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
