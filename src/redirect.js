module.exports = {
  error: (res, redirectUrl, err) => {
    var url = new URL(redirectUrl);
    url.searchParams.set('error', err);

    res.redirect(url);
  },

  success: (res, redirectUrl, params) => {
    var url = new URL(redirectUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    res.redirect(url);
  },
};
