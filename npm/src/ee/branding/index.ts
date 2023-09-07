import type { Storable, AdminPortalBranding, JacksonOption } from '../../typings';
import { throwIfInvalidLicense } from '../common/checkLicense';

export class BrandingController {
  private store: Storable;
  private storeKey = 'branding';
  private opts: JacksonOption;

  constructor({ store, opts }: { store: Storable; opts: JacksonOption }) {
    this.store = store;
    this.opts = opts;
  }

  // Get branding
  public async get() {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const branding: AdminPortalBranding = await this.store.get(this.storeKey);

    const defaultBranding = {
      logoUrl: null,
      faviconUrl: null,
      companyName: null,
      primaryColor: null,
      textColor: null,
      borderColor: null,
      backgroundColor: null,
      darkTheme: null,
    };

    return branding ? branding : defaultBranding;
  }

  // Update branding
  public async update(params: Partial<AdminPortalBranding>) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const {
      logoUrl,
      faviconUrl,
      companyName,
      primaryColor,
      textColor,
      borderColor,
      backgroundColor,
      darkTheme,
    } = params;

    const currentBranding = await this.get();

    const newBranding = {
      logoUrl: logoUrl ?? null,
      faviconUrl: faviconUrl ?? null,
      companyName: companyName ?? null,
      primaryColor: primaryColor ?? null,
      textColor: textColor ?? null,
      borderColor: borderColor ?? null,
      backgroundColor: backgroundColor ?? null,
      darkTheme: darkTheme ?? null,
    };

    const updatedbranding = {
      ...currentBranding,
      ...newBranding,
    };

    await this.store.put(this.storeKey, updatedbranding);

    return updatedbranding;
  }
}
