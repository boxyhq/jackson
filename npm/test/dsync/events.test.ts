import { DirectorySync, Directory } from '../../src/typings';
import tap from 'tap';
import groups from './data/groups';
import users from './data/users';
import { default as usersRequest } from './data/user-requests';
import { default as groupRequest } from './data/group-requests';
import { getFakeDirectory } from './data/directories';
import { getDatabaseOption } from '../utils';
import axios from 'axios';
import sinon from 'sinon';
import { createPayload, createSignatureString } from '../../src/directory-sync/events';

let directorySync: DirectorySync;
let directory: Directory;
const fakeDirectory = getFakeDirectory();

const webhook: Directory['webhook'] = {
  endpoint: 'http://localhost',
  secret: 'secret',
};

tap.before(async () => {
  const jackson = await (await import('../../src/index')).default(getDatabaseOption());

  directorySync = jackson.directorySync;

  // Create a directory before starting the test
  directory = await directorySync.directories.create({
    ...fakeDirectory,
    webhook_url: webhook.endpoint,
    webhook_secret: webhook.secret,
  });

  // Turn on webhook event logging for the directory
  await directorySync.directories.update(directory.id, {
    log_webhook_events: true,
  });

  directorySync.events.setTenantAndProduct(directory.tenant, directory.product);
  directorySync.users.setTenantAndProduct(directory.tenant, directory.product);
});

tap.teardown(async () => {
  // Delete the directory after the test
  await directorySync.directories.delete(directory.id);

  process.exit(0);
});

tap.test('Webhook Events / ', async (t) => {
  tap.afterEach(async () => {
    await directorySync.events.clear();
  });

  t.test("Should be able to get the directory's webhook", async (t) => {
    t.match(directory.webhook.endpoint, webhook.endpoint);
    t.match(directory.webhook.secret, webhook.secret);

    t.end();
  });

  t.test('Should not log events if the directory has no webhook', async (t) => {
    await directorySync.directories.update(directory.id, {
      webhook: {
        endpoint: '',
        secret: '',
      },
    });

    // Create a user
    await directorySync.usersRequest.handle(usersRequest.create(directory.id, users[0]));

    const events = await directorySync.events.getAll();

    t.equal(events.length, 0);

    // Restore the directory's webhook
    await directorySync.directories.update(directory.id, {
      webhook: {
        endpoint: webhook.endpoint,
        secret: webhook.secret,
      },
    });
  });

  t.test('Should not log webhook events if the logging is turned off', async (t) => {
    // Turn off webhook event logging for the directory
    await directorySync.directories.update(directory.id, {
      log_webhook_events: false,
    });

    // Create a user
    await directorySync.usersRequest.handle(usersRequest.create(directory.id, users[0]));

    const events = await directorySync.events.getAll();

    t.equal(events.length, 0);

    // Turn on webhook event logging for the directory
    await directorySync.directories.update(directory.id, {
      log_webhook_events: true,
    });

    t.end();
  });

  t.test('Should be able to get event by id', async (t) => {
    // Create a user
    await directorySync.usersRequest.handle(usersRequest.create(directory.id, users[0]));

    const events = await directorySync.events.getAll();

    const event = await directorySync.events.get(events[0].id);

    t.equal(event.id, events[0].id);

    t.end();
  });

  t.test('Should send user related events', async (t) => {
    const mock = sinon.mock(axios);

    mock.expects('post').thrice().withArgs(webhook.endpoint).throws();

    // Create the user
    const { data: createdUser } = await directorySync.usersRequest.handle(
      usersRequest.create(directory.id, users[0])
    );

    // Update the user
    const { data: updatedUser } = await directorySync.usersRequest.handle(
      usersRequest.updateById(directory.id, createdUser.id, users[0])
    );

    // Delete the user
    const { data: deletedUser } = await directorySync.usersRequest.handle(
      usersRequest.deleteById(directory.id, createdUser.id)
    );

    mock.verify();
    mock.restore();

    const events = await directorySync.events.getAll();

    t.ok(events);
    t.equal(events.length, 3);

    t.match(events[0].payload.event, 'user.deleted');
    t.match(events[0].payload.directory_id, directory.id);
    t.hasStrict(events[0].payload.data.raw, deletedUser);

    t.match(events[1].payload.event, 'user.updated');
    t.match(events[1].payload.directory_id, directory.id);
    t.hasStrict(events[1].payload.data.raw, updatedUser);

    t.match(events[2].payload.event, 'user.created');
    t.match(events[2].payload.directory_id, directory.id);
    t.hasStrict(events[2].payload.data.raw, createdUser);

    await directorySync.users.clear();

    t.end();
  });

  t.test('Should send group related events', async (t) => {
    const mock = sinon.mock(axios);

    mock.expects('post').thrice().withArgs(webhook.endpoint).throws();

    // Create the group
    const { data: createdGroup } = await directorySync.groupsRequest.handle(
      groupRequest.create(directory.id, groups[0])
    );

    // Update the group
    const { data: updatedGroup } = await directorySync.groupsRequest.handle(
      groupRequest.updateById(directory.id, createdGroup.id, groups[0])
    );

    // Delete the group
    const { data: deletedGroup } = await directorySync.groupsRequest.handle(
      groupRequest.deleteById(directory.id, createdGroup.id)
    );

    mock.verify();
    mock.restore();

    const events = await directorySync.events.getAll();

    t.ok(events);
    t.equal(events.length, 3);

    t.match(events[0].payload.event, 'group.deleted');
    t.match(events[0].payload.directory_id, directory.id);
    t.hasStrict(events[0].payload.data.raw, deletedGroup);

    t.match(events[1].payload.event, 'group.updated');
    t.match(events[1].payload.directory_id, directory.id);
    t.hasStrict(events[1].payload.data.raw, updatedGroup);

    t.match(events[2].payload.event, 'group.created');
    t.match(events[2].payload.directory_id, directory.id);
    t.hasStrict(events[2].payload.data.raw, createdGroup);

    t.end();
  });

  t.test('Should send group membership related events', async (t) => {
    const mock = sinon.mock(axios);

    mock.expects('post').exactly(4).withArgs(webhook.endpoint).throws();

    // Create the user
    const { data: createdUser } = await directorySync.usersRequest.handle(
      usersRequest.create(directory.id, users[0])
    );

    // Create the group
    const { data: createdGroup } = await directorySync.groupsRequest.handle(
      groupRequest.create(directory.id, groups[0])
    );

    // Add the user to the group
    const { data: addedMember } = await directorySync.groupsRequest.handle(
      groupRequest.addMembers(directory.id, createdGroup.id, [{ value: createdUser.id }])
    );

    // Remove the user from the group
    const { data: removedMember } = await directorySync.groupsRequest.handle(
      groupRequest.removeMembers(
        directory.id,
        createdGroup.id,
        [{ value: createdUser.id }],
        `members[value eq "${createdUser.id}"]`
      )
    );

    mock.verify();
    mock.restore();

    const events = await directorySync.events.getAll();

    t.ok(events);
    t.equal(events.length, 4);

    t.match(events[0].payload.event, 'group.user_removed');
    t.match(events[0].payload.directory_id, directory.id);
    t.hasStrict(events[0].payload.data.raw, createdUser);
    t.hasStrict(events[0].payload.data.group.raw, removedMember);

    t.match(events[1].payload.event, 'group.user_added');
    t.match(events[1].payload.directory_id, directory.id);
    t.hasStrict(events[1].payload.data.raw, createdUser);
    t.hasStrict(events[1].payload.data.group.raw.displayName, addedMember.displayName);

    await directorySync.users.delete(createdUser.id);
    await directorySync.groups.delete(createdGroup.id);

    t.end();
  });

  t.test('createPayload()', async (t) => {
    // Create an user
    const { data: createdUser } = await directorySync.usersRequest.handle(
      usersRequest.create(directory.id, users[0])
    );

    const user = await directorySync.users.get(createdUser.id);

    const webhookPayload = createPayload('user.created', {
      directory,
      user,
    });

    t.match(webhookPayload.event, 'user.created');
    t.match(webhookPayload.directory_id, directory.id);
    t.strictSame(webhookPayload.data, user);

    // Create the group
    const { data: createdGroup } = await directorySync.groupsRequest.handle(
      groupRequest.create(directory.id, groups[0])
    );

    const group = await directorySync.groups.get(createdGroup.id);

    const webhookPayload2 = createPayload('group.created', {
      directory,
      group,
    });

    t.match(webhookPayload2.event, 'group.created');
    t.match(webhookPayload2.directory_id, directory.id);
    t.strictSame(webhookPayload2.data, group);

    await directorySync.users.delete(createdUser.id);
    await directorySync.groups.delete(createdGroup.id);

    t.end();
  });

  t.test('createSignatureString()', async (t) => {
    const payload = {
      event: 'user.created',
      directory_id: directory.id,
      tenant: directory.tenant,
      product: directory.product,
    };

    const signatureString = await createSignatureString(directory.webhook.secret, payload);
    const parts = signatureString.split(',');

    t.ok(signatureString);
    t.ok(parts[0].match(/^t=[0-9a-f]/));
    t.ok(parts[1].match(/^s=[0-9a-f]/));

    // Empty secret should create an empty signature
    const emptySignatureString = await createSignatureString('', payload);

    t.match(emptySignatureString, '');

    t.end();
  });

  t.end();
});
