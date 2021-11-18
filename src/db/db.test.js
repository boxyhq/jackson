const t = require('tap');

const DB = require('./db.js');

let configStores = [];
let ttlStores = [];
const ttl = 3;

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

const dbs = [
  {
    engine: 'mem',
    ttlCleanup: 1,
  },
  {
    engine: 'redis',
    url: 'redis://localhost:6379',
  },
  {
    engine: 'sql',
    url: 'postgresql://postgres:postgres@localhost:5432/postgres',
    type: 'postgres',
  },
  {
    engine: 'mongo',
    url: 'mongodb://localhost:27017/jackson',
  },
  {
    engine: 'sql',
    url: 'mysql://root:mysql@localhost:3307/mysql',
    type: 'mysql',
  },
  {
    engine: 'sql',
    url: 'mariadb://root@localhost:3306/mysql',
    type: 'mariadb',
  },
];

t.before(async () => {
  for (const idx in dbs) {
    const opts = dbs[idx];
    const db = await DB.new(opts);

    configStores.push(db.store('saml:config'));
    ttlStores.push(db.store('oauth:session', ttl));
  }
});

t.teardown(async () => {
  process.exit(0);
});

t.test('dbs', ({ end }) => {
  for (const idx in configStores) {
    const configStore = configStores[idx];
    const ttlStore = ttlStores[idx];
    let dbEngine = dbs[idx].engine;
    if (dbs[idx].type) {
      dbEngine += ': ' + dbs[idx].type;
    }
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
      const ret1 = await configStore.get(record1.id);
      const ret2 = await configStore.get(record2.id);

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
      t.same(
        ret2.sort((a, b) => a.id.localeCompare(b.id)),
        [record1, record2].sort((a, b) => a.id.localeCompare(b.id)),
        'unable to get index "city"'
      );

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

      const ret1 = await configStore.get(record1.id);
      const ret2 = await configStore.get(record2.id);

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

    t.test('ttl indexes: ' + dbEngine, async (t) => {
      try {
        await ttlStore.put(
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

        t.fail('expecting a secondary indexes not allow on a store with ttl');
      } catch (err) {
        t.ok(err, 'got expected error');
      }

      t.end();
    });

    t.test('ttl put(): ' + dbEngine, async (t) => {
      await ttlStore.put(record1.id, record1);

      await ttlStore.put(record2.id, record2);

      t.end();
    });

    t.test('ttl get(): ' + dbEngine, async (t) => {
      const ret1 = await ttlStore.get(record1.id);
      const ret2 = await ttlStore.get(record2.id);

      t.same(ret1, record1, 'unable to get record1');
      t.same(ret2, record2, 'unable to get record2');

      t.end();
    });

    t.test('ttl expiry: ' + dbEngine, async (t) => {
      // mongo runs ttl task every 60 seconds
      if (dbEngine.startsWith('sql') || dbEngine.startsWith('mongo')) {
        t.end();
        return;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, ((dbEngine === 'mem' ? 5 : 0) + ttl + 0.5) * 1000)
      );

      const ret1 = await ttlStore.get(record1.id);
      const ret2 = await ttlStore.get(record2.id);

      t.same(ret1, null, 'ttl for record1 failed');
      t.same(ret2, null, 'ttl for record2 failed');

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
