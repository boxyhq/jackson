const ripemd160 = require('ripemd160');

const key = (namespace, key) => {
  return namespace + ':' + key;
};

const keyForIndex = (namespace, idx) => {
  return key(key(namespace, idx.name), idx.value);
};

const keyDigest = (key) => {
  return new ripemd160().update(key).digest('hex');
};

module.exports = {
  key,

  keyForIndex,

  keyDigest,
};
