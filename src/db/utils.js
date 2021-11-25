const Ripemd160 = require('ripemd160');

const key = (namespace, k) => {
  return namespace + ':' + k;
};

const keyForIndex = (namespace, idx) => {
  return key(key(namespace, idx.name), idx.value);
};

const keyDigest = (k) => {
  return new Ripemd160().update(k).digest('hex');
};

const keyFromParts = (...parts) => {
  return parts.join(':'); // TODO: pick a better strategy, keys can collide now
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

module.exports = {
  key,
  keyForIndex,
  keyDigest,
  keyFromParts,
  sleep,
  indexPrefix: '_index',
};
