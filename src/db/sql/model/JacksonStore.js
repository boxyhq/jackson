/*export */ class JacksonStore {
  constructor(id, namespace, key, value, indexes) {
    this.id = id;
    this.namespace = namespace;
    this.key = key;
    this.value = value;
    this.indexes = indexes;
  }
}

module.exports = JacksonStore;
