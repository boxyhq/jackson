const mem = require("./mem");

module.exports = {
  new: function (engine, options) {
    switch (engine) {
      case 'mem':
        return mem.new(options);
        break;
    }
  },
};
