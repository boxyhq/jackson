import { IndexNames } from '../../controller/utils';
import type { Storable, JacksonOption } from '../../typings';
import { throwIfInvalidLicense } from '../common/checkLicense';
import { randomUUID } from 'crypto';

export type SecurityLogsConfigCreate = {
  tenant: string;
  config: any;
  type: string;
};

export type SecurityLogsConfig = {
  id: string;
  tenant: string;
  config: any;
  type: string;
};

export class SecurityLogsConfigController {
  private store: Storable;
  private opts: JacksonOption;

  constructor({ store, opts }: { store: Storable; opts: JacksonOption }) {
    this.store = store;
    this.opts = opts;
  }

  public async createSecurityLogsConfig(params: SecurityLogsConfigCreate): Promise<string> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const record = {
      tenant: params.tenant,
      type: params.type,
      config: params.config,
    };

    const id = randomUUID();

    await this.store.put(id, record, {
      name: IndexNames.Tenant,
      value: params.tenant,
    });

    return id;
  }

  public async getAll(tenant?: string, pageOffset?: number, pageLimit?: number, pageToken?: string) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    return tenant
      ? await this.store.getByIndex(
          {
            name: IndexNames.Tenant,
            value: tenant,
          },
          pageOffset,
          pageLimit,
          pageToken
        )
      : await this.store.getAll(pageOffset, pageLimit, pageToken);
  }

  public async get(id: string): Promise<SecurityLogsConfig | undefined> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    return await this.store.get(id);
  }

  public async update(id: string, config: any): Promise<SecurityLogsConfig> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const currentConfig = await this.get(id);

    if (!currentConfig) {
      throw new Error(`Security logs config with id ${id} not found`);
    }

    const newConfig = {
      type: currentConfig.type,
      tenant: currentConfig.tenant,
      config: config ?? currentConfig.config,
    };

    const updatedConfig = {
      ...currentConfig,
      ...newConfig,
    };

    await this.store.put(id, updatedConfig, {
      name: IndexNames.Tenant,
      value: updatedConfig.tenant,
    });

    return updatedConfig;
  }

  public async delete(id: string): Promise<void> {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    await this.store.delete(id);
  }
}
