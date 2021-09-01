class Mem {
  constructor(options) {
    this.records = {};
  }

  get(key) {
    return this.records[key];
  }

  put(key, val) {
    this.records[key] = val;
  }
}

module.exports = {
  new: function (options) {
    return new Mem(options);
  },
};
