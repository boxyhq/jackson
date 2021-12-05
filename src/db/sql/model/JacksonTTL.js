/*export */ class JacksonTTL {
  constructor(key, expiresAt) {
    this.key = key;
    this.expiresAt = expiresAt;
  }
}

module.exports = JacksonTTL;
