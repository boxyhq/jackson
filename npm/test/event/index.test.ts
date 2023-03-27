import tap from 'tap';
import sinon from 'sinon';
import controllers from '../../src/index';
import { jacksonOptions } from '../utils';
import EventController from '../../src/event';
import type {
  EventPayloadSchema,
  IConnectionAPIController,
  IDirectorySyncController,
  SAMLSSOConnectionWithEncodedMetadata,
  SAMLSSORecord,
} from '../../src/typings';
import { saml_connection } from '../sso/fixture';
import { transformDirectoryConnection, transformSAMLSSOConnection } from '../../src/event/utils';
import { getFakeDirectory } from '../dsync/data/directories';

let ssoConnectionController: IConnectionAPIController;
let directoryConnectionController: IDirectorySyncController['directories'];

tap.before(async () => {
  const jackson = await controllers(jacksonOptions);

  ssoConnectionController = jackson.connectionAPIController;
  directoryConnectionController = jackson.directorySyncController.directories;
});

tap.teardown(async () => {
  process.exit(0);
});

const assertCalledWith = (spy: sinon.SinonSpy, args: any[]) => {
  sinon.assert.calledOnce(spy);
  sinon.assert.calledWith(spy, ...args);

  spy.restore();
};

tap.test('should send sso.created event', async (t) => {
  const body = {
    ...saml_connection,
    metadataUrl: 'https://mocksaml.com/api/saml/metadata',
  } as SAMLSSOConnectionWithEncodedMetadata;

  const eventType = 'sso.created' as const;

  const sendWebhookEventSpy = sinon.spy(EventController.prototype, 'sendWebhookEvent');
  const notifySpy = sinon.spy(EventController.prototype, 'notify');

  const connection = await ssoConnectionController.createSAMLConnection(body);

  const payload: EventPayloadSchema = {
    event: eventType,
    tenant: connection.tenant,
    product: connection.product,
    data: transformSAMLSSOConnection(connection),
  };

  assertCalledWith(notifySpy, [eventType, connection]);
  assertCalledWith(sendWebhookEventSpy, [jacksonOptions.webhook, payload]);

  t.end();
});

// TODO: Add test for sso.activated event
tap.test('should send sso.activated event', async (t) => {
  t.pass();
  t.end();
});

// TODO: Add test for sso.deactivated event
tap.test('should send sso.deactivated event', async (t) => {
  t.pass();
  t.end();
});

tap.test('should send sso.deleted event', async (t) => {
  const body = {
    ...saml_connection,
    metadataUrl: 'https://mocksaml.com/api/saml/metadata',
  } as SAMLSSOConnectionWithEncodedMetadata;

  // Create a connection
  await ssoConnectionController.createSAMLConnection(body);

  const eventType = 'sso.deleted' as const;

  const sendWebhookEventSpy = sinon.spy(EventController.prototype, 'sendWebhookEvent');
  const notifySpy = sinon.spy(EventController.prototype, 'notify');

  const connections = await ssoConnectionController.getConnections({
    tenant: saml_connection.tenant,
    product: saml_connection.product,
  });

  const connection = connections[0] as SAMLSSORecord;

  const payload: EventPayloadSchema = {
    event: eventType,
    tenant: saml_connection.tenant,
    product: saml_connection.product,
    data: transformSAMLSSOConnection(connection),
  };

  // Delete the connection
  await ssoConnectionController.deleteConnections({
    clientID: connection.clientID,
    clientSecret: connection.clientSecret,
  });

  assertCalledWith(notifySpy, [eventType, connection]);
  assertCalledWith(sendWebhookEventSpy, [jacksonOptions.webhook, payload]);

  t.end();
});

tap.test('should send dsync.created event', async (t) => {
  const eventType = 'dsync.created' as const;

  const sendWebhookEventSpy = sinon.spy(EventController.prototype, 'sendWebhookEvent');
  const notifySpy = sinon.spy(EventController.prototype, 'notify');

  // Create a connection
  const { data: connection, error } = await directoryConnectionController.create(getFakeDirectory());

  if (!connection) {
    t.fail('No connection was created');
    throw error;
  }

  const payload: EventPayloadSchema = {
    event: eventType,
    tenant: connection.tenant,
    product: connection.product,
    data: transformDirectoryConnection(connection),
  };

  assertCalledWith(notifySpy, [eventType, connection]);
  assertCalledWith(sendWebhookEventSpy, [jacksonOptions.webhook, payload]);

  t.end();
});

// TODO: Add test for dsync.activated event
tap.test('should send dsync.activated event', async (t) => {
  t.pass();
  t.end();
});

// TODO: Add test for dsync.deactivated event
tap.test('should send dsync.deactivated event', async (t) => {
  t.pass();
  t.end();
});

tap.test('should send dsync.deleted event', async (t) => {
  // Create a connection
  const { data: connection, error } = await directoryConnectionController.create(getFakeDirectory());

  if (!connection) {
    t.fail('No connection was created');
    throw error;
  }

  const eventType = 'dsync.deleted' as const;

  const sendWebhookEventSpy = sinon.spy(EventController.prototype, 'sendWebhookEvent');
  const notifySpy = sinon.spy(EventController.prototype, 'notify');

  const payload: EventPayloadSchema = {
    event: eventType,
    tenant: connection.tenant,
    product: connection.product,
    data: transformDirectoryConnection(connection),
  };

  // Delete the connection
  await directoryConnectionController.delete(connection.id);

  assertCalledWith(notifySpy, [eventType, connection]);
  assertCalledWith(sendWebhookEventSpy, [jacksonOptions.webhook, payload]);

  t.end();
});
