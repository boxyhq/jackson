/*export */ class JacksonStore {
  constructor(key, value, indexes) {
    this.key = key;
    this.value = value;
    this.indexes = indexes;
  }
}

module.exports = JacksonStore;
