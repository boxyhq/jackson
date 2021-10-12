const dbutils = require('../db-utils.js');
const { Sequelize, DataTypes, Model } = require('sequelize');

class MysqlStore {
  constructor(namespace, db, ttl = 0) {
    this.namespace = namespace;
    this.db = db;
    this.ttl = ttl;
    const options = {
        host    : db.db.client.config.host,
        dialect : "mysql",
        logging : false,
    };

    this.sequelize = new Sequelize("jackson", db.db.client.config.user, db.db.client.config.password, options);
    this.table = this.sequelize.define(this.namespace, {
        // Model attributes are defined here
        key: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        value: {
          type: DataTypes.STRING
          // allowNull defaults to true
        }
      }, {
        // Other model options go here
      });
      this.table.sync().then((res, err) => {
          if(!err) {
              console.log("Table created =>", res.name);
          } else {
              console.log("Table creation error =>", err);
          }
      });
  }

  async get(key) {
    return this.db.get(this.namespace, dbutils.keyDigest(key));
  }

  async getByIndex(idx) {
    idx.value = dbutils.keyDigest(idx.value);
    return this.db.getByIndex(this.namespace, idx);
  }

  async put(key, val, ...indexes) {
    indexes = (indexes || []).map((idx) => {
      idx.value = dbutils.keyDigest(idx.value);
      return idx;
    });
    this.db.put(this.namespace, dbutils.keyDigest(key), val, this.ttl, ...indexes);
  }

  async delete(key) {
    return this.db.delete(this.namespace, dbutils.keyDigest(key));
  }
}

module.exports = {
  new: (namespace, db, ttl = 0) => {
    return new MysqlStore(namespace, db, ttl);
  },
};
