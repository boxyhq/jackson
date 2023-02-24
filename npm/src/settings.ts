import type { Storable, AdminPortalSettings } from './typings';

const defaultSettings = {
  branding: {
    logoUrl: null,
    pageTitle: null,
    primaryColor: null,
  },
};

export class SettingsController {
  private store: Storable;
  private storeKey = 'settings';

  constructor({ store }: { store: Storable }) {
    this.store = store;
  }

  public async get() {
    const settings: AdminPortalSettings = await this.store.get(this.storeKey);

    return settings ? settings : defaultSettings;
  }

  public async update(params: { branding: Partial<AdminPortalSettings['branding']> }) {
    const { branding } = params;

    const settings = await this.get();

    const updatedSettings = {
      ...settings,
    };

    // If branding is provided, update it
    if (branding) {
      const { logoUrl, pageTitle, primaryColor } = branding;
      const { branding: defaultBranding } = defaultSettings;

      updatedSettings.branding = {
        logoUrl: logoUrl || defaultBranding.logoUrl,
        pageTitle: pageTitle || defaultBranding.pageTitle,
        primaryColor: primaryColor || defaultBranding.primaryColor,
      };
    }

    await this.store.put(this.storeKey, updatedSettings);

    return updatedSettings;
  }
}
