const t = require('tap');
const { dbEngine } = require('../env.js');

const DB = require('./db.js');

let configStoreMap = {};

const record1 = {
  id: '1',
  name: 'Deepak',
  city: 'London',
};
const record2 = {
  id: '2',
  name: 'Sama',
  city: 'London',
};

const dbs = ['redis', 'sql'];

t.before(async () => {
  for (const idx in dbs) {
    const db = await DB.new(dbs[idx], {
      url: null,
    });

    configStoreMap[dbs[idx]] = db.store('saml:config');
  }
});

t.teardown(async () => {
  process.exit(0);
});

t.test('dbs', ({ end }) => {
  for (const dbEngine in configStoreMap) {
    const configStore = configStoreMap[dbEngine];
    t.test('put(): ' + dbEngine, async (t) => {
      await configStore.put(
        record1.id,
        record1,
        {
          // secondary index on city
          name: 'city',
          value: record1.city,
        },
        {
          // secondary index on name
          name: 'name',
          value: record1.name,
        }
      );

      await configStore.put(
        record2.id,
        record2,
        {
          // secondary index on city
          name: 'city',
          value: record2.city,
        },
        {
          // secondary index on name
          name: 'name',
          value: record2.name,
        }
      );

      t.end();
    });

    t.test('get(): ' + dbEngine, async (t) => {
      const ret1 = await configStore.get('1');
      const ret2 = await configStore.get('2');

      t.same(ret1, record1, `expected ${record1} but got ${ret1}`);
      t.same(ret2, record2, `expected ${record2} but got ${ret2}`);

      t.end();
    });

    t.test('getByIndex(): ' + dbEngine, async (t) => {
      const ret1 = await configStore.getByIndex({
        name: 'name',
        value: record1.name,
      });

      const ret2 = await configStore.getByIndex({
        name: 'city',
        value: record1.city,
      });

      t.same(
        ret1,
        [record1],
        `expected ${JSON.stringify[record1]} but got ${ret1}`
      );
      t.same(
        ret2,
        [record1, record2],
        `expected ${[record1, record2]} but got ${ret2}`
      );

      t.end();
    });
  }
  end();
});
