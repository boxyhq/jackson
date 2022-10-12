import { DatabaseEngine, DatabaseOption, EncryptionKey, Storable } from '../../src/typings';
import tap from 'tap';
import DB from '../../src/db/db';

const encryptionKey: EncryptionKey = 'I+mnyTixBoNGu0OtpG0KXJSunoPTiWMb';

const connectionStores: Storable[] = [];
const ttlStores: Storable[] = [];
const ttl = 2;

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

const records: any = [record1, record2];

const memDbConfig = <DatabaseOption>{
  engine: 'mem',
  ttl: 1,
};

const redisDbConfig = <DatabaseOption>{
  engine: 'redis',
  url: 'redis://localhost:6379',
};

const postgresDbConfig = <DatabaseOption>{
  engine: 'sql',
  url: 'postgresql://postgres:postgres@localhost:5432/postgres',
  type: 'postgres',
  ttl: 1,
  cleanupLimit: 10,
};

const mongoDbConfig = <DatabaseOption>{
  engine: 'mongo',
  url: 'mongodb://localhost:27017/jackson',
};

const mysqlDbConfig = <DatabaseOption>{
  engine: 'sql',
  url: 'mysql://root:mysql@localhost:3307/mysql',
  type: 'mysql',
  ttl: 1,
  cleanupLimit: 10,
};

const planetscaleDbConfig = <DatabaseOption>{
  engine: 'planetscale',
  url: process.env.PLANETSCALE_URL,
  ttl: 1,
  cleanupLimit: 10,
  ssl: {
    rejectUnauthorized: true,
  },
};

const mariadbDbConfig = <DatabaseOption>{
  engine: 'sql',
  url: 'mariadb://root@localhost:3306/mysql',
  type: 'mariadb',
  ttl: 1,
  cleanupLimit: 10,
};

const dbs = [
  {
    ...memDbConfig,
  },
  {
    ...memDbConfig,
    encryptionKey,
  },
  {
    ...redisDbConfig,
  },
  {
    ...redisDbConfig,
    encryptionKey,
  },
  {
    ...postgresDbConfig,
  },
  {
    ...postgresDbConfig,
    encryptionKey,
  },
  {
    ...mongoDbConfig,
  },
  {
    ...mongoDbConfig,
    encryptionKey,
  },
  {
    ...mysqlDbConfig,
  },
  {
    ...mysqlDbConfig,
    encryptionKey,
  },
  {
    ...mariadbDbConfig,
  },
  {
    ...mariadbDbConfig,
    encryptionKey,
  },
];

// if (process.env.PLANETSCALE_URL) {
//   dbs.push(
//     {
//       ...planetscaleDbConfig,
//     },
//     {
//       ...planetscaleDbConfig,
//       encryptionKey,
//     }
//   );
// }

tap.before(async () => {
  for (const idx in dbs) {
    const opts = dbs[idx];
    const db = await DB.new(opts);

    const randomSession = Date.now();
    connectionStores.push(db.store('saml:config:' + randomSession));
    ttlStores.push(db.store('oauth:session:' + randomSession, ttl));
  }
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('dbs', ({ end }) => {
  for (const idx in connectionStores) {
    const connectionStore = connectionStores[idx];
    const ttlStore = ttlStores[idx];
    let dbEngine = dbs[idx].engine!;

    if (dbs[idx].type) {
      dbEngine += ': ' + dbs[idx].type;
    }

    tap.test('put(): ' + dbEngine, async (t) => {
      await connectionStore.put(
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

      await connectionStore.put(
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

    tap.test('get(): ' + dbEngine, async (t) => {
      const ret1 = await connectionStore.get(record1.id);
      const ret2 = await connectionStore.get(record2.id);

      t.same(ret1, record1, 'unable to get record1');
      t.same(ret2, record2, 'unable to get record2');

      t.end();
    });

    tap.test('getAll(): ' + dbEngine, async (t) => {
      // getAll(pageOffset?: number, pageLimit?: number): Promise<unknown[]>;

      const allRecords: any = await connectionStore.getAll();
      const allRecordOutput = {};
      let allRecordInput = {};
      for (const keyValue in records) {
        const keyVal = records[keyValue.toString()];
        allRecordOutput[keyVal];
      }
      for (const keyValue in allRecords) {
        const keyVal = records[keyValue.toString()];
        allRecordInput[allRecords[keyVal]];
      }
      t.same(allRecordInput, allRecordOutput, 'unable to getAll record');
      allRecordInput = {};
      let allRecordsWithPaggination: any = await connectionStore.getAll(0, 2);
      for (const keyValue in allRecordsWithPaggination) {
        const keyVal = records[keyValue.toString()];
        allRecordInput[allRecordsWithPaggination[keyVal]];
      }

      t.same(allRecordInput, allRecordOutput, 'unable to getAll record');
      allRecordsWithPaggination = await connectionStore.getAll(0, 0);
      for (const keyValue in allRecordsWithPaggination) {
        const keyVal = records[keyValue.toString()];
        allRecordInput[allRecordsWithPaggination[keyVal]];
      }

      t.same(allRecordInput, allRecordOutput, 'unable to getAll record');
      t.end();
    });

    tap.test('getByIndex(): ' + dbEngine, async (t) => {
      const ret1 = await connectionStore.getByIndex({
        name: 'name',
        value: record1.name,
      });

      const ret2 = await connectionStore.getByIndex({
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

    tap.test('delete(): ' + dbEngine, async (t) => {
      await connectionStore.delete(record1.id);

      const ret0 = await connectionStore.getByIndex({
        name: 'city',
        value: record1.city,
      });

      t.same(ret0, [record2], 'unable to get index "city" after delete');

      await connectionStore.delete(record2.id);

      const ret1 = await connectionStore.get(record1.id);
      const ret2 = await connectionStore.get(record2.id);

      const ret3 = await connectionStore.getByIndex({
        name: 'name',
        value: record1.name,
      });
      const ret4 = await connectionStore.getByIndex({
        name: 'city',
        value: record1.city,
      });

      t.same(ret1, null, 'delete for record1 failed');
      t.same(ret2, null, 'delete for record2 failed');

      t.same(ret3, [], 'delete for record1 failed');
      t.same(ret4, [], 'delete for record2 failed');

      t.end();
    });

    tap.test('ttl indexes: ' + dbEngine, async (t) => {
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

    tap.test('ttl put(): ' + dbEngine, async (t) => {
      await ttlStore.put(record1.id, record1);

      await ttlStore.put(record2.id, record2);

      t.end();
    });

    tap.test('ttl get(): ' + dbEngine, async (t) => {
      const ret1 = await ttlStore.get(record1.id);
      const ret2 = await ttlStore.get(record2.id);

      t.same(ret1, record1, 'unable to get record1');
      t.same(ret2, record2, 'unable to get record2');

      t.end();
    });

    tap.test('ttl expiry: ' + dbEngine, async (t) => {
      // mongo runs ttl task every 60 seconds
      if (dbEngine.startsWith('mongo')) {
        t.end();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, (2 * ttl + 0.5) * 1000));

      const ret1 = await ttlStore.get(record1.id);
      const ret2 = await ttlStore.get(record2.id);

      t.same(ret1, null, 'ttl for record1 failed');
      t.same(ret2, null, 'ttl for record2 failed');

      t.end();
    });
  }

  tap.test('db.new() error', async (t) => {
    try {
      await DB.new(<DatabaseOption>{
        engine: <DatabaseEngine>'mongo',
      });

      await DB.new(<DatabaseOption>{
        engine: <DatabaseEngine>'sql',
        url: tap.expectUncaughtException().toString(),
      });

      t.ok(
        <DatabaseOption>{
          engine: <DatabaseEngine>'sql',
          url: tap.expectUncaughtException().toString(),
        },
        'db must have connection'
      );
      await DB.new({
        engine: <DatabaseEngine>'',
      });
      await DB.new(<DatabaseOption>{
        engine: <DatabaseEngine>'somedb',
      });
      t.fail('expecting an unsupported db error');
    } catch (err) {
      t.ok(err, 'got expected error');
    }

    t.end();
  });

  end();
});
