module.exports = {
  redirect: (redirectUrl, redirectUrls) => {
    const url = new URL(redirectUrl);

    for (const idx in redirectUrls) {
      const rUrl = new URL(redirectUrls[idx]);
      // TODO: Check pathname, for now pathname is ignored
      if (
        rUrl.protocol === url.protocol &&
        rUrl.hostname === url.hostname &&
        rUrl.port === url.port
      ) {
        return true;
      }
    }

    return false;
  },
};
