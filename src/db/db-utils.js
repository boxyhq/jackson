const ripemd160 = require('ripemd160');

const key = (namespace, k) => {
  return namespace + ':' + k;
};

const keyForIndex = (namespace, idx) => {
  return key(key(namespace, idx.name), idx.value);
};

const keyDigest = (k) => {
  return new ripemd160().update(k).digest('hex');
};

module.exports = {
  key,

  keyForIndex,

  keyDigest,
};
