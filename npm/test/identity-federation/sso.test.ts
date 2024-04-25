import tap from 'tap';
import path from 'path';
import sinon from 'sinon';
import { promisify } from 'util';
import { deflateRaw } from 'zlib';
import saml from '@boxyhq/saml20';
import { promises as fs } from 'fs';

const deflateRawAsync = promisify(deflateRaw);

import { jacksonOptions } from '../utils';
import { tenant, product, serviceProvider } from './constants';
import type {
  ISAMLFederationController,
  IConnectionAPIController,
  IOAuthController,
  SAMLFederationApp,
  SAMLSSORecord,
} from '../../src';

let oauthController: IOAuthController;
let samlFederatedController: ISAMLFederationController;
let connectionAPIController: IConnectionAPIController;

let app: SAMLFederationApp;
let connection: SAMLSSORecord;

tap.before(async () => {
  const jackson = await (await import('../../src/index')).default(jacksonOptions);

  oauthController = jackson.oauthController;
  samlFederatedController = jackson.samlFederatedController;
  connectionAPIController = jackson.connectionAPIController;

  // Create app
  app = await samlFederatedController.app.create({
    name: 'Test App',
    tenant,
    product,
    entityId: serviceProvider.entityId,
    acsUrl: serviceProvider.acsUrl,
  });

  // Create SAML connection
  connection = await connectionAPIController.createSAMLConnection({
    tenant,
    product,
    rawMetadata: await fs.readFile(path.join(__dirname, '/data/metadata.xml'), 'utf8'),
    defaultRedirectUrl: 'http://localhost:3366/sso/callback',
    redirectUrl: '["http://localhost:3366"]',
  });
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('Federated SAML flow', async (t) => {
  t.teardown(async () => {
    await samlFederatedController.app.delete({ id: app.id });
    await connectionAPIController.deleteConnections({ tenant, product });
  });

  t.test('Federated SAML flow', async (t) => {
    const relayStateFromSP = 'sp-saml-request-relay-state';

    const requestXML = await fs.readFile(path.join(__dirname, '/data/request.xml'), 'utf8');
    const responseXML = await fs.readFile(path.join(__dirname, '/data/response.xml'), 'utf8');

    const samlRequestFromSP = Buffer.from(await deflateRawAsync(requestXML)).toString('base64');
    const samlResponseFromIdP = Buffer.from(responseXML).toString('base64');

    let jacksonRelayState: string | null = null;

    t.test('Should be able to accept SAML Request from SP and generate SAML Request for IdP', async (t) => {
      const response = await samlFederatedController.sso.getAuthorizeUrl({
        request: samlRequestFromSP,
        relayState: relayStateFromSP,
        samlBinding: 'HTTP-Redirect',
      });

      // Extract relay state created by Jackson
      jacksonRelayState = new URL(response.redirect_url).searchParams.get('RelayState');

      t.ok(
        response.redirect_url?.startsWith(`${connection.idpMetadata.sso.redirectUrl}`),
        'Should have a SSO URL that starts with IdP SSO URL'
      );
      t.ok(response.redirect_url, 'Should have a redirect URL');
      t.ok(response.redirect_url?.includes('SAMLRequest'), 'Should have a SAMLRequest in the redirect URL');
      t.ok(response.redirect_url?.includes('RelayState'), 'Should have a RelayState in the redirect URL');
    });

    t.test('Should be able to accept SAML Response from IdP and generate SAML Response for SP', async (t) => {
      const stubValidate = sinon.stub(saml, 'validate').resolves({
        audience: 'https://saml.boxyhq.com',
        claims: {
          id: '00u3e3cmpdDydXdzV5d7',
          email: 'kiran@boxyhq.com',
          firstName: 'Kiran',
          lastName: 'Krishnan',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': 'kiran@boxyhq.com',
        },
        issuer: 'https://saml.example.com/entityid',
        sessionIndex: '_a30730c45288bbc4986b',
      });

      const response = await oauthController.samlResponse({
        SAMLResponse: samlResponseFromIdP,
        RelayState: jacksonRelayState ?? '',
      });

      t.ok(response);
      t.ok('response_form' in response);
      t.ok(
        response.response_form?.includes('SAMLResponse'),
        'Should have a SAMLResponse in the response form'
      );
      t.ok(response.response_form?.includes('RelayState'), 'Should have a RelayState in the response form');

      const relayState = response.response_form
        ? response.response_form.match(/<input type="hidden" name="RelayState" value="(.*)"\/>/)?.[1]
        : null;

      t.match(relayState, relayStateFromSP, 'Should have the same relay state as the one sent by SP');

      stubValidate.restore();
    });
  });
});
