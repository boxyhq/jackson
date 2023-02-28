import type { Storable, AdminPortalBranding, AdminPortalSettings } from '../../typings';

export class BrandingController {
  private store: Storable;
  private storeKey = 'settings';

  constructor({ store }: { store: Storable }) {
    this.store = store;
  }

  // Get branding settings
  public async get(): Promise<AdminPortalBranding> {
    const settings: AdminPortalSettings = await this.store.get(this.storeKey);

    const defaultBranding = {
      logoUrl: null,
      faviconUrl: null,
      companyName: null,
      primaryColor: null,
    };

    return settings ? settings.branding : defaultBranding;
  }

  // Update branding settings
  public async update(params: Partial<AdminPortalBranding>) {
    const settings: AdminPortalSettings = await this.store.get(this.storeKey);

    const { logoUrl, faviconUrl, companyName, primaryColor } = params;

    const brandingUpdated = {
      logoUrl: logoUrl ?? null,
      faviconUrl: faviconUrl ?? null,
      companyName: companyName ?? null,
      primaryColor: primaryColor ?? null,
    };

    const settingsUpdated = {
      ...settings,
      branding: brandingUpdated,
    };

    await this.store.put(this.storeKey, settingsUpdated);

    return brandingUpdated;
  }
}
