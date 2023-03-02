import type { Storable, AdminPortalBranding } from '../../typings';

export class BrandingController {
  private store: Storable;
  private storeKey = 'branding';

  constructor({ store }: { store: Storable }) {
    this.store = store;
  }

  // Get branding
  public async get(): Promise<AdminPortalBranding> {
    const branding: AdminPortalBranding = await this.store.get(this.storeKey);

    const defaultBranding = {
      logoUrl: null,
      faviconUrl: null,
      companyName: null,
      primaryColor: null,
    };

    return branding ? branding : defaultBranding;
  }

  // Update branding
  public async update(params: Partial<AdminPortalBranding>) {
    const { logoUrl, faviconUrl, companyName, primaryColor } = params;

    const currentBranding: AdminPortalBranding = await this.get();

    const newBranding = {
      logoUrl: logoUrl ?? null,
      faviconUrl: faviconUrl ?? null,
      companyName: companyName ?? null,
      primaryColor: primaryColor ?? null,
    };

    const updatedbranding = {
      ...currentBranding,
      ...newBranding,
    };

    await this.store.put(this.storeKey, updatedbranding);

    return updatedbranding;
  }
}
