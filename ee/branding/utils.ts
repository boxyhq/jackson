import jackson from '@lib/jackson';
import { boxyhqHosted } from '@lib/env';

// BoxyHQ branding
const boxyhqBranding = {
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  companyName: 'BoxyHQ',
  primaryColor: '#25c2a0',
} as const;

export const getPortalBranding = async () => {
  const { brandingController, checkLicense } = await jackson();

  // If the licence is not valid, return the default branding
  if (!(await checkLicense())) {
    return boxyhqBranding;
  }

  const customBranding = await brandingController?.get();

  return {
    logoUrl: customBranding?.logoUrl || boxyhqBranding.logoUrl,
    primaryColor: customBranding?.primaryColor || boxyhqBranding.primaryColor,
    faviconUrl: customBranding?.faviconUrl || boxyhqBranding.faviconUrl,
    companyName: customBranding?.companyName || boxyhqBranding.companyName,
  };
};

/**
 * Get the branding for a specific product.
 * If the product does not have a custom branding, return the default branding
 * @param productId
 * @returns
 */
export const getProductBranding = async (productId: string) => {
  const { checkLicense, productController } = await jackson();

  if (!(await checkLicense())) {
    return boxyhqBranding;
  }

  if (!boxyhqHosted || !productId) {
    return boxyhqBranding;
  }

  const productBranding = await productController?.get(productId);

  return {
    logoUrl: productBranding.logoUrl || boxyhqBranding.logoUrl,
    faviconUrl: productBranding.faviconUrl || boxyhqBranding.faviconUrl,
    companyName: productBranding.companyName || boxyhqBranding.companyName,
    primaryColor: productBranding.primaryColor || boxyhqBranding.primaryColor,
  };
};
