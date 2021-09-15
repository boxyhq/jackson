const crypto = require('crypto');

const transformBase64 = (input) => {
  return input.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const encode = (code_challenge) => {
  return transformBase64(
    crypto.createHash('sha256').update(code_challenge).digest('base64')
  );
};

module.exports = {
  encode,
  transformBase64,
};
