import jackson from '@lib/jackson';

// BoxyHQ branding
export const boxyhqBranding = {
  logoUrl: 'http://localhost:5225/logo.png',
  faviconUrl: 'http://localhost:5225/favicon.ico',
  companyName: 'BoxyHQ',
  primaryColor: '#25c2a0',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  borderColor: '#0000000',
  darkTheme: null,
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
    backgroundColor: customBranding?.backgroundColor || boxyhqBranding.backgroundColor,
    textColor: customBranding?.textColor || boxyhqBranding.textColor,
    borderColor: customBranding?.borderColor || boxyhqBranding.borderColor,
    faviconUrl: customBranding?.faviconUrl || boxyhqBranding.faviconUrl,
    companyName: customBranding?.companyName || boxyhqBranding.companyName,
    darkTheme: customBranding?.darkTheme || boxyhqBranding.darkTheme,
  };
};
