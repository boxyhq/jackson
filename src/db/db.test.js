const t = require('tap');

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

      t.same(ret1, record1, 'unable to get record1');
      t.same(ret2, record2, 'unable to get record2');

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

      t.same(ret1, [record1], 'unable to get index "name"');
      t.same(ret2, [record1, record2], 'unable to get index "city"');

      t.end();
    });

    t.test('delete(): ' + dbEngine, async (t) => {
      await configStore.delete(record1.id);

      const ret0 = await configStore.getByIndex({
        name: 'city',
        value: record1.city,
      });

      t.same(ret0, [record2], 'unable to get index "city" after delete');

      await configStore.delete(record2.id);

      const ret1 = await configStore.get('1');
      const ret2 = await configStore.get('2');

      const ret3 = await configStore.getByIndex({
        name: 'name',
        value: record1.name,
      });
      const ret4 = await configStore.getByIndex({
        name: 'city',
        value: record1.city,
      });

      t.same(ret1, null, 'delete for record1 failed');
      t.same(ret2, null, 'delete for record2 failed');

      t.same(ret3, [], 'delete for record1 failed');
      t.same(ret4, [], 'delete for record2 failed');

      t.end();
    });
  }

  t.test('db.new() error', async (t) => {
    try {
      await DB.new('somedb');
      t.fail('expecting an unsupported db error');
    } catch (err) {
      t.ok(err, 'got expected error');
    }

    t.end();
  });

  end();
});
