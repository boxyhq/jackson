import type { JacksonOption, DatabaseStore } from '../typings';
import { SSOHandler } from './sso';
import { App } from './app';

// This is the main entry point for the SAML Federation module
const SAMLFederation = async ({ db, opts }: { db: DatabaseStore; opts: JacksonOption }) => {
  const appStore = db.store('samlfed:apps');
  const sessionStore = db.store('samlfed:session');
  const connectionStore = db.store('saml:config');

  const app = new App({ store: appStore, opts });
  const sso = new SSOHandler({ app, opts, sessionStore, connectionStore });

  const response = {
    app,
    sso,
  };

  return response;
};

export default SAMLFederation;

export type SAMLFederation = Awaited<ReturnType<typeof SAMLFederation>>;

// SAML Federation flow:
// SP (Eg: Twilio Flex) --> SAML Jackson --> IdP (Eg: Okta) --> SAML Jackson --> SP (Eg: Twilio Flex)
// 1. SP send SAML Request to Jackson's SSO endpoint
// 2. Jackson process SAML Request and create a new session to store SP request information
// 3. Jackson create a new SAML Request and send it to chosen IdP
// 4. After successful authentication, IdP send (POST) SAML Response to Jackson's ACS endpoint
// 5. Jackson process SAML Response from the IdP and create a new SAML Response to send (POST) back to the SP's ACS endpoint
