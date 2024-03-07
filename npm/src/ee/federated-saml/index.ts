import { SSO } from './sso';
import { App } from './app';
import type { JacksonOption, SSOTracerInstance } from '../../typings';
import { SSOHandler } from '../../controller/sso-handler';

// This is the main entry point for the Identity Federation module
const SAMLFederation = async ({
  db,
  opts,
  ssoTracer,
}: {
  db;
  opts: JacksonOption;
  ssoTracer: SSOTracerInstance;
}) => {
  const appStore = db.store('samlfed:apps');
  const sessionStore = db.store('oauth:session', opts.db.ttl);
  const connectionStore = db.store('saml:config');

  const ssoHandler = new SSOHandler({
    connection: connectionStore,
    session: sessionStore,
    opts,
  });

  const app = new App({ store: appStore, opts });
  const sso = new SSO({ app, ssoHandler, ssoTracer, opts });

  const response = {
    app,
    sso,
  };

  return response;
};

export default SAMLFederation;

export * from './types';

// SAML Federation flow:
// SP (Eg: Twilio Flex) --> SAML Jackson --> IdP (Eg: Okta) --> SAML Jackson --> SP (Eg: Twilio Flex)
// 1. SP send SAML Request to Jackson's SSO endpoint
// 2. Jackson process SAML Request and create a new session to store SP request information
// 3. Jackson create a new SAML Request and send it to chosen IdP
// 4. After successful authentication, IdP send (POST) SAML Response to Jackson's ACS endpoint
// 5. Jackson process SAML Response from the IdP and create a new SAML Response to send (POST) back to the SP's ACS endpoint
