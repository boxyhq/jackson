const redirectUrlPlaceholder = 'http://_boxyhq_redirect_not_in_use';

export const redirect = (redirectUrl: string, redirectUrls: string[]): boolean => {
  // Don't allow redirect to URL placeholder
  if (redirectUrl === redirectUrlPlaceholder) {
    return false;
  }

  const url: URL = new URL(redirectUrl);

  for (const idx in redirectUrls) {
    const rUrl: URL = new URL(redirectUrls[idx]);

    let hostname = url.hostname;
    let hostNameAllowed = rUrl.hostname;

    // allow subdomain globbing *.example.com only
    try {
      if (rUrl.hostname.startsWith('*.')) {
        hostNameAllowed = rUrl.hostname.slice(2);
        hostname = hostname.slice(hostname.indexOf('.') + 1);
      }
    } catch (e) {
      // no-op
    }

    // TODO: Check pathname, for now pathname is ignored

    if (rUrl.protocol === url.protocol && hostNameAllowed === hostname && rUrl.port === url.port) {
      return true;
    }
  }

  return false;
};
