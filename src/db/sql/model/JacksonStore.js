/*export */ class JacksonStore {
  constructor(id, namespace, key, value) {
    this.id = id;
    this.namespace = namespace;
    this.key = key;
    this.value = value;
  }
}

module.exports = JacksonStore;
