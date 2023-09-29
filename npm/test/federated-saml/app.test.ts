import tap from 'tap';

import { ISAMLFederationController } from '../../src';
import { jacksonOptions } from '../utils';
import { tenant, product, serviceProvider, appId } from './constants';

let samlFederatedController: ISAMLFederationController;

tap.before(async () => {
  const jackson = await (await import('../../src/index')).default(jacksonOptions);

  samlFederatedController = jackson.samlFederatedController;
});

tap.test('Federated SAML App', async () => {
  const app = await samlFederatedController.app.create({
    name: 'Test App',
    tenant,
    product,
    entityId: serviceProvider.entityId,
    acsUrl: serviceProvider.acsUrl,
  });

  tap.test('Should be able to create a new SAML Federation app', async (t) => {
    t.ok(app);
    t.match(app.id, appId);
    t.match(app.tenant, tenant);
    t.match(app.product, product);
    t.match(app.entityId, serviceProvider.entityId);
    t.match(app.acsUrl, serviceProvider.acsUrl);
  });

  tap.test('Should be able to get the SAML Federation app by id', async (t) => {
    const response = await samlFederatedController.app.get({ id: app.id });

    t.ok(response);
    t.match(response.id, app.id);
  });

  tap.test('Should be able to get the SAML Federation app by entity id', async (t) => {
    const response = await samlFederatedController.app.getByEntityId(serviceProvider.entityId);

    t.ok(response);
    t.match(response.entityId, serviceProvider.entityId);
  });

  tap.test('Should be able to update the SAML Federation app', async (t) => {
    const response = await samlFederatedController.app.update(app.id, {
      name: 'Updated App Name',
      acsUrl: 'https://twilio.com/saml/acsUrl/updated',
    });

    t.ok(response);
    t.match(response.name, 'Updated App Name');
    t.match(response.acsUrl, 'https://twilio.com/saml/acsUrl/updated');

    const updatedApp = await samlFederatedController.app.get({ id: app.id });

    t.ok(updatedApp);
    t.match(updatedApp.name, 'Updated App Name');
    t.match(updatedApp.acsUrl, 'https://twilio.com/saml/acsUrl/updated');
  });

  tap.test('Should be able to update the app branding', async (t) => {
    const response = await samlFederatedController.app.update(app.id, {
      logoUrl: 'https://company.com/logo.png',
      faviconUrl: 'https://company.com/favicon.ico',
      primaryColor: '#000000',
    });

    t.ok(response);
    t.match(response.logoUrl, 'https://company.com/logo.png');
    t.match(response.faviconUrl, 'https://company.com/favicon.ico');
    t.match(response.primaryColor, '#000000');

    const updatedApp = await samlFederatedController.app.get({ id: app.id });

    t.ok(updatedApp);
    t.match(updatedApp.logoUrl, 'https://company.com/logo.png');
    t.match(updatedApp.faviconUrl, 'https://company.com/favicon.ico');
    t.match(updatedApp.primaryColor, '#000000');
  });

  tap.test('Should be able to get all SAML Federation apps', async (t) => {
    const response = await samlFederatedController.app.getAll({});

    t.ok(response);
    t.ok(response.data.length === 1);
  });

  tap.test('Should be able to delete the SAML Federation app', async (t) => {
    await samlFederatedController.app.delete({ id: app.id });

    const allApps = await samlFederatedController.app.getAll({});

    t.ok(allApps.data.length === 0);
  });
});

tap.teardown(async () => {
  process.exit(0);
});
