/*export */ class JacksonStore {
  constructor(key, value, expiresAt) {
    this.key = key;
    this.value = value;
    this.expiresAt = expiresAt;
  }
}

module.exports = JacksonStore;
