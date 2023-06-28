import jackson from '@lib/jackson';

// BoxyHQ branding
export const boxyhqBranding = {
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
