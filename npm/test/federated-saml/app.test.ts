import tap from 'tap';

import { ISAMLFederationController } from '../../src';
import { jacksonOptions } from '../utils';
import { tenant, product, serviceProvider, appId } from './constants';
import { getDefaultCertificate } from '../../src/saml/x509';

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

  tap.test('Should be able to create a new Identity Federation app', async (t) => {
    t.ok(app);
    t.match(app.id, appId);
    t.match(app.tenant, tenant);
    t.match(app.product, product);
    t.match(app.entityId, serviceProvider.entityId);
    t.match(app.acsUrl, serviceProvider.acsUrl);
  });

  tap.test('Should be able to get the Identity Federation app by id', async (t) => {
    const response = await samlFederatedController.app.get({ id: app.id });

    t.ok(response);
    t.match(response.id, app.id);
  });

  tap.test('Should be able to get the Identity Federation app by entity id', async (t) => {
    const response = await samlFederatedController.app.getByEntityId(serviceProvider.entityId);

    t.ok(response);
    t.match(response.entityId, serviceProvider.entityId);
  });

  tap.test('Get the app by tenant and product', async (t) => {
    const response = await samlFederatedController.app.get({ tenant, product });

    t.ok(response);
    t.match(response.id, app.id);
    t.match(response.tenant, tenant);
    t.match(response.product, product);
  });

  tap.test('Get the apps by product', async (t) => {
    const apps = await samlFederatedController.app.getByProduct({ product });

    t.ok(apps);
    t.ok(apps.data.length === 1);
    t.match(apps.data[0], app);
  });

  tap.test('Should be able to update the Identity Federation app', async (t) => {
    // Update by id
    const response = await samlFederatedController.app.update({
      id: app.id,
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

    // Update by tenant and product
    const response2 = await samlFederatedController.app.update({
      tenant,
      product,
      name: 'Updated App Name 2',
      acsUrl: 'https://twilio.com/saml/acsUrl/updated2',
    });

    t.ok(response2);
    t.match(response2.name, 'Updated App Name 2');
    t.match(response2.acsUrl, 'https://twilio.com/saml/acsUrl/updated2');
  });

  tap.test('Should be able to update the app branding', async (t) => {
    const response = await samlFederatedController.app.update({
      id: app.id,
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

  tap.test('Should be able to remove the app branding', async (t) => {
    const response = await samlFederatedController.app.update({
      id: app.id,
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '',
    });

    t.ok(response);
    t.match(response.logoUrl, null);
    t.match(response.faviconUrl, null);
    t.match(response.primaryColor, null);

    const updatedApp = await samlFederatedController.app.get({ id: app.id });

    t.ok(updatedApp);
    t.match(updatedApp.logoUrl, null);
    t.match(updatedApp.faviconUrl, null);
    t.match(updatedApp.primaryColor, null);
  });

  tap.test('Should be able to get all Identity Federation apps', async (t) => {
    const response = await samlFederatedController.app.getAll({});

    t.ok(response);
    t.ok(response.data.length === 1);
  });

  tap.test('Should be able to get the metadata', async (t) => {
    const response = await samlFederatedController.app.getMetadata();

    const certs = await getDefaultCertificate();

    t.ok(response);
    t.match(response.entityId, jacksonOptions.samlAudience);
    t.match(response.ssoUrl, `${jacksonOptions.externalUrl}/api/federated-saml/sso`);
    t.match(response.x509cert, certs.publicKey);
  });

  tap.test('Delete the app by id', async (t) => {
    await samlFederatedController.app.delete({ id: app.id });

    const allApps = await samlFederatedController.app.getAll({});

    t.ok(allApps.data.length === 0);
  });

  tap.test('Delete the app by tenant and product', async (t) => {
    await samlFederatedController.app.create({
      name: 'Test App',
      tenant,
      product,
      entityId: serviceProvider.entityId,
      acsUrl: serviceProvider.acsUrl,
    });

    await samlFederatedController.app.delete({ tenant, product });

    const allApps = await samlFederatedController.app.getAll({});

    t.ok(allApps.data.length === 0);
  });
});

tap.teardown(async () => {
  process.exit(0);
});
