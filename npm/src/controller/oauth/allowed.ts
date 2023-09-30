export const redirect = (redirectUrl: string, redirectUrls: string[]): boolean => {
  const url: URL = new URL(redirectUrl);

  for (const idx in redirectUrls) {
    const rUrl: URL = new URL(redirectUrls[idx]);

    // TODO: Check pathname, for now pathname is ignored

    if (rUrl.protocol === url.protocol && rUrl.hostname === url.hostname && rUrl.port === url.port) {
      return true;
    }
  }

  return false;
};
