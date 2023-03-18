import tap from 'tap';
import sinon from 'sinon';
import controllers from '../../src/index';
import { jacksonOptions } from '../utils';
import EventController from '../../src/event';
import type {
  IConnectionAPIController,
  SAMLSSOConnectionWithEncodedMetadata,
  SAMLSSORecord,
} from '../../src/typings';
import { saml_connection } from '../sso/fixture';
import { transformSSOConnection } from '../../src/event/utils';

let ssoConnectionController: IConnectionAPIController;

tap.before(async () => {
  const jackson = await controllers(jacksonOptions);

  ssoConnectionController = jackson.connectionAPIController;
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('Events: SSO Connection', async (t) => {
  tap.test('sso.created', async (t) => {
    const body = {
      ...saml_connection,
      metadataUrl: 'https://mocksaml.com/api/saml/metadata',
    } as SAMLSSOConnectionWithEncodedMetadata;

    const eventType = 'sso.created' as const;

    const sendWebhookEventSpy = sinon.spy(EventController.prototype, 'sendWebhookEvent');
    const notifySpy = sinon.spy(EventController.prototype, 'notify');

    const connection = await ssoConnectionController.createSAMLConnection(body);

    const payload = {
      event: eventType,
      tenant: connection.tenant,
      product: connection.product,
      data: transformSSOConnection(connection),
    };

    sinon.assert.calledOnce(notifySpy);
    sinon.assert.calledWith(notifySpy, eventType, connection);

    sinon.assert.called(sendWebhookEventSpy);
    sinon.assert.calledWith(sendWebhookEventSpy, jacksonOptions.webhook, payload);

    notifySpy.restore();
    sendWebhookEventSpy.restore();

    t.end();
  });

  tap.test('sso.deleted', async (t) => {
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

    const payload = {
      event: eventType,
      tenant: saml_connection.tenant,
      product: saml_connection.product,
      data: transformSSOConnection(connection),
    };

    // Delete the connection
    await ssoConnectionController.deleteConnections({
      clientID: connection.clientID,
      clientSecret: connection.clientSecret,
    });

    sinon.assert.calledOnce(notifySpy);
    sinon.assert.calledWith(notifySpy, eventType, connection);

    sinon.assert.called(sendWebhookEventSpy);
    sinon.assert.calledWith(sendWebhookEventSpy, jacksonOptions.webhook, payload);

    notifySpy.restore();
    sendWebhookEventSpy.restore();

    t.end();
  });

  t.end();
});

// const assertCalledWith = (spy: sinon.SinonSpy, args: any[]) => {
//   sinon.assert.calledOnce(spy);
//   sinon.assert.calledWith(spy, ...args);
// };
