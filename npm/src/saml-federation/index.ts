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

  return {
    app,
    sso,
  };
};

export default SAMLFederation;

export type SAMLFederation = Awaited<ReturnType<typeof SAMLFederation>>;
