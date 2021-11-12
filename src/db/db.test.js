const t = require('tap');

const DB = require('./db.js');

let configStores = [];

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
    options: {},
  },
  {
    engine: 'redis',
    options: { url: 'redis://localhost:6379' },
  },
  {
    engine: 'sql',
    options: {
      url: 'postgresql://postgres:postgres@localhost:5432/postgres',
      type: 'postgres',
    },
  },
  {
    engine: 'mongo',
    options: { url: 'mongodb://localhost:27017/jackson' },
  },
  {
    engine: 'sql',
    options: {
      url: 'mysql://root:mysql@localhost:3307/mysql',
      type: 'mysql',
    },
  },
];

t.before(async () => {
  for (const idx in dbs) {
    const config = dbs[idx];
    const engine = config.engine;
    const opts = config.options;
    opts.engine = engine;
    const db = await DB.new(opts);

    configStores.push(db.store('saml:config'));
  }
});

t.teardown(async () => {
  process.exit(0);
});

t.test('dbs', ({ end }) => {
  for (const idx in configStores) {
    const configStore = configStores[idx];
    const dbEngine = dbs[idx].engine;
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
