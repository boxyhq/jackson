import * as fs from 'fs';
import * as path from 'path';
import sinon from 'sinon';
import tap from 'tap';
import saml from '@boxyhq/saml20';
import controllers from '../../src/index';
import {
  IConnectionAPIController,
  IOAuthController,
  SAMLResponsePayload,
  SAMLSSOConnectionWithRawMetadata,
} from '../../src/typings';
import { jacksonOptions } from '../utils';

const TENANT = 'boxyhq.com';
const PRODUCT = 'crm';
const REDIRECT_URI = 'http://localhost:3366/sso/oauth/completed';
const ISSUER = 'https://accounts.google.com/o/saml2';

let conn: IConnectionAPIController;
let oauth: IOAuthController;
let rawResponse: string;

// The same assertion posted once, then replayed verbatim.
const post = async (relayState: string | null = '', assertionId = '_the_same_assertion_id') => {
  const stub = sinon.stub(saml, 'validate').resolves({
    audience: '',
    issuer: ISSUER,
    sessionIndex: 'session-1',
    assertionId,
    claims: { id: 'alice@boxyhq.com', email: 'alice@boxyhq.com' },
  } as any);

  try {
    return await oauth.samlResponse(<SAMLResponsePayload>{
      SAMLResponse: rawResponse,
      RelayState: relayState,
    });
  } finally {
    stub.restore();
  }
};

const codeFrom = (redirectUrl?: string) =>
  redirectUrl ? new URLSearchParams(new URL(redirectUrl).search).get('code') : null;

tap.before(async () => {
  const c = await controllers({ ...jacksonOptions, idpEnabled: true });
  conn = c.connectionAPIController;
  oauth = c.oauthController;

  await conn.createSAMLConnection({
    defaultRedirectUrl: REDIRECT_URI,
    redirectUrl: '["http://localhost:3366"]',
    tenant: TENANT,
    product: PRODUCT,
    name: TENANT,
    rawMetadata: fs.readFileSync(path.join(__dirname, '/data/metadata/boxyhq.xml'), 'utf8'),
  } as SAMLSSOConnectionWithRawMetadata);

  rawResponse = fs.readFileSync(path.join(__dirname, '/data/saml_response'), 'utf8').trim();
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('an assertion is single use', async (t) => {
  t.test('SP-initiated: the second post is refused', async (t) => {
    const { redirect_url } = (await oauth.authorize(<any>{
      tenant: TENANT,
      product: PRODUCT,
      client_id: `tenant=${TENANT}&product=${PRODUCT}`,
      redirect_uri: REDIRECT_URI,
      state: 'state-123',
    })) as { redirect_url: string };

    const relayState = new URLSearchParams(new URL(redirect_url).search).get('RelayState');

    t.ok(codeFrom((await post(relayState, '_sp_assertion_id')).redirect_url), 'the first post is accepted');

    try {
      await post(relayState, '_sp_assertion_id');
      t.fail('Expecting JacksonError.');
    } catch (err: any) {
      t.equal(err.message, 'Unable to validate state from the origin request.', 'the replay is refused');
    }
  });

  t.test('IdP-initiated: the second post is refused', async (t) => {
    t.ok(codeFrom((await post('', '_idp_assertion_id')).redirect_url), 'the first post is accepted');

    try {
      await post('', '_idp_assertion_id');
      t.fail('Expecting replay to be refused.');
    } catch (err: any) {
      t.match(err.message, /already been used|replay detected/i, 'the replay is refused');
    }
  });
});
