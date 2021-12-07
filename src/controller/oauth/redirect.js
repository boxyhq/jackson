module.exports = {
  error: (res, redirectUrl, err) => {
    var url = new URL(redirectUrl);
    url.searchParams.set('error', err);

    res.redirect(url);
  },

  success: (redirectUrl, params) => {
    const url = new URL(redirectUrl);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return url.href;
  },
};
