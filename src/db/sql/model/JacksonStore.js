/*export */ class JacksonStore {
  constructor(key, value, iv, tag) {
    this.key = key;
    this.value = value;
    this.iv = iv;
    this.tag = tag;
  }
}

module.exports = JacksonStore;
