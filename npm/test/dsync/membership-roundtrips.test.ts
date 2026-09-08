import tap from 'tap';
import mem from '../../src/db/mem';
import type {
  DatabaseDriver,
  Directory,
  DirectorySyncEvent,
  Encrypted,
  Group,
  IDirectorySyncController,
  PutManyRecord,
} from '../../src/typings';
import groups from './data/groups';
import { createGroupMembershipRequest } from './data/group-requests';
import { getFakeDirectory } from './data/directories';
import { jacksonOptions } from '../utils';

const calls: Record<string, number> = {};

const count = (name: string) => {
  calls[name] = (calls[name] || 0) + 1;
};

const resetCalls = () => {
  for (const key of Object.keys(calls)) {
    delete calls[key];
  }
};

const countingDriver = async (): Promise<DatabaseDriver> => {
  const inner = await mem.new({ db: { engine: 'mem' } });

  return {
    getAll: (...args) => (count('getAll'), inner.getAll(...args)),
    get: (...args) => (count('get'), inner.get(...args)),
    put: async (namespace, key, ...args) => {
      count('put');
      if (namespace.startsWith('dsync:members') && (await inner.get(namespace, key))) {
        throw Object.assign(new Error('Duplicate entry'), { code: 'ER_DUP_ENTRY' });
      }
      return inner.put(namespace, key, ...args);
    },
    delete: (...args) => (count('delete'), inner.delete(...args)),
    getByIndex: (...args) => (count('getByIndex'), inner.getByIndex(...args)),
    deleteMany: (...args) => (count('deleteMany'), inner.deleteMany(...args)),
    getMany: async (namespace: string, keys: string[]) => {
      count('getMany');
      return Promise.all(keys.map((key) => inner.get(namespace, key)));
    },
    putMany: async (namespace: string, records: PutManyRecord<Encrypted>[], ttl: number) => {
      count('putMany');
      for (const record of records) {
        await inner.put(namespace, record.key, record.value, ttl, ...(record.indexes || []));
      }
    },
    close: () => inner.close(),
    getStats: () => inner.getStats(),
  };
};

let directorySync: IDirectorySyncController;
let directory: Directory;
let group: Group;

tap.before(async () => {
  const jackson = await (
    await import('../../src/index')
  ).default({
    ...jacksonOptions,
    db: { driver: await countingDriver() },
  });

  directorySync = jackson.directorySyncController;

  const directoryResponse = await directorySync.directories.create(getFakeDirectory());

  if (!directoryResponse.data) {
    tap.fail("Couldn't create a directory");
    return;
  }

  directory = directoryResponse.data;

  const groupResponse = await directorySync.groups
    .setTenantAndProduct(directory.tenant, directory.product)
    .create({
      directoryId: directory.id,
      name: groups[0].displayName,
      raw: groups[0],
    });

  if (!groupResponse.data) {
    tap.fail("Couldn't create a group");
    return;
  }

  group = groupResponse.data;
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('Group membership PATCH uses a bounded number of database round trips', async (t) => {
  const memberCount = 256;
  const members = Array.from({ length: memberCount }, (_, i) => ({ value: `user-${i}` }));

  await directorySync.groups.addUsersToGroup(
    group.id,
    members.slice(0, memberCount / 2).map((member) => member.value)
  );

  resetCalls();

  const events: DirectorySyncEvent[] = [];

  const { status } = await directorySync.requests.handle(
    createGroupMembershipRequest(directory, group, [{ op: 'add', path: 'members', value: members }]),
    async (event: DirectorySyncEvent) => {
      events.push(event);
    }
  );

  t.equal(status, 200);
  t.equal(events.length, memberCount, 'one event per member');

  t.equal(calls.getMany, 2, 'one batch read for memberships and one for users');
  t.equal(calls.putMany, 1, 'one batch write for the new memberships');
  t.equal(calls.put ?? 0, 0, 'no per-member writes');
  t.ok((calls.get ?? 0) <= 4, `per-record reads are bounded (got ${calls.get ?? 0})`);

  const stored = await directorySync.groups.getGroupMembers({
    groupId: group.id,
    pageLimit: memberCount + 1,
  });
  t.equal(stored.data?.length, memberCount, 'every member is stored once');

  resetCalls();

  const removed = await directorySync.requests.handle(
    createGroupMembershipRequest(directory, group, [{ op: 'remove', path: 'members', value: members }]),
    async () => {
      t.fail('unexpected event');
    }
  );

  t.equal(removed.status, 200);
  t.equal(calls.deleteMany, 1, 'one batch delete for the removed memberships');
  t.equal(calls.getMany, 1, 'one batch read for the users');
  t.equal(calls.delete ?? 0, 0, 'no per-member deletes');
  t.equal(calls.put ?? 0, 0, 'no per-member writes');

  t.same((await directorySync.groups.getGroupMembers({ groupId: group.id })).data, []);

  t.end();
});

tap.test('Concurrent PATCHes adding the same members treat existing memberships as success', async (t) => {
  t.teardown(async () => {
    await directorySync.directories.delete(directory.id);
    await directorySync.groups.delete(group.id);
  });

  const members = Array.from({ length: 50 }, (_, i) => ({ value: `race-${i}` }));
  const patch = () =>
    directorySync.requests.handle(
      createGroupMembershipRequest(directory, group, [{ op: 'add', path: 'members', value: members }])
    );

  const results = await Promise.all([patch(), patch(), patch()]);

  t.same(
    results.map((result) => result.status),
    [200, 200, 200]
  );

  const stored = await directorySync.groups.getGroupMembers({ groupId: group.id, pageLimit: 100 });
  t.equal(stored.data?.length, members.length);

  await directorySync.groups.removeUsersFromGroup(
    group.id,
    members.map((member) => member.value)
  );

  t.end();
});
