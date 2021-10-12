const { Sequelize, DataTypes, Model } = require('sequelize');
const mysql = require('mysql2');
const dbutils = require('./db-utils.js');

class MySQL {
  constructor(options) {
    return (async () => {
      let opts = {};
      let database = "jackson";
      if (options && options.url) {
        opts = {
          host: options.url,
          user: options.username,
          password: options.password
        };
      }
      this.client = mysql.createConnection(opts);

      this.client.on('error', (err) => console.log('MySQL Client Error', err));

      await this.client.connect(function (err) {
        if (err) {
            throw err;
        } else {
            console.log("MySQL Db connection established!");
        }
      });

      const sequelizeOptions = {
        host    : opts.host,
        dialect : "mysql",
        logging : false,
    };

      this.sequelize = new Sequelize("jackson", opts.user, opts.password, sequelizeOptions);

      const query = `CREATE DATABASE IF NOT EXISTS ${database}`;
            this.client.query(query, function (err, result) {
                if (err) {
                    console.log(err.message);
                    var str = result ? result.toString() : null;
                    if (str != null){
                        console.log(str);
                    }
                } else {
                    console.log(`Database created!`);
                }
            });

            this.setTable = this.sequelize.define("sets", {
                // Model attributes are defined here
                set: {
                  type: DataTypes.STRING,
                  allowNull: false,
                },
                key: {
                  type: DataTypes.STRING
                  // allowNull defaults to true
                }
              }, {
                // Other model options go here
              });
              this.setTable.sync().then((res, err) => {
                  if(!err) {
                      console.log("Table created =>", res.name);
                  } else {
                      console.log("Table creation error =>", err);
                  }
              });

      return this; // Return the newly-created instance
    })();
  }

  async get(namespace, key) {
    let res = await this.client.query(`SELECT * from ${this.database}.${namespace} WHERE key=${key}) limit 1`);
    return res;
  }

  async getByIndex(namespace, idx) {
    const dbKeys = await this.client.query(`SELECT key from ${this.database}.sets WHERE key=${dbutils.keyForIndex(namespace, idx)})`);

    const ret = [];
    for (const dbKey of dbKeys || []) {
      ret.push(await this.get(namespace, dbKey));
    }

    return ret;
  }

  async put(namespace, key, val, ttl = 0, ...indexes) {
    let existing = await this.get(namespace, key);
    if(existing) {
        await this.client.query(`UPDATE ${this.database}.${namespace} SET value=${val} WHERE key=${key})`);
    } else {
        await this.client.query(`INSERT INTO ${this.database}.${namespace} (key, value) VALUES ('${key}', '${val}')`);
    }
    
    for (const idx of indexes || []) {
        await this.client.query(`INSERT INTO ${this.database}.sets (set, key) VALUES ('${dbutils.keyForIndex(namespace, idx)}', '${key}')`);
    }
  }

  async delete(namespace, key) {
    let res = await this.client.query(`DELETE * from ${namespace} WHERE key=${key})`);
    return res;
  }
}

module.exports = {
  new: async (options) => {
    return new MySQL(options);
  },
};
