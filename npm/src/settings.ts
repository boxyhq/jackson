import type { Storable, AdminPortalSettings } from './typings';

export class SettingsController {
  private store: Storable;
  private storeKey = 'settings';

  constructor({ store }: { store: Storable }) {
    this.store = store;
  }

  public async get(): Promise<AdminPortalSettings> {
    const settings: AdminPortalSettings = await this.store.get(this.storeKey);

    // If no settings are found, return the default settings values
    const defaultSettings = {
      branding: {
        logoUrl: null,
        faviconUrl: null,
        companyName: null,
        primaryColor: null,
      },
    };

    return settings ?? defaultSettings;
  }

  public async update(params: { branding: Partial<AdminPortalSettings['branding']> }) {
    const settings = await this.get();

    const updatedSettings = {
      ...settings,
    };

    const { branding } = params;

    // If branding is provided, update it
    if (branding) {
      const { logoUrl, faviconUrl, companyName, primaryColor } = branding;

      updatedSettings.branding = {
        logoUrl: logoUrl ?? null,
        faviconUrl: faviconUrl ?? null,
        companyName: companyName ?? null,
        primaryColor: primaryColor ?? null,
      };
    }

    await this.store.put(this.storeKey, updatedSettings);

    return updatedSettings;
  }
}
