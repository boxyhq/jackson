class Mem {
  constructor() {
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
  new: function () {
    return new Mem();
  },
};
