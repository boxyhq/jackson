import type { DatabaseStore } from '../typings';
import { SSOHandler } from './sso';
import { App } from './app';

export type SAMLFederation = Awaited<ReturnType<typeof SAMLFederation>>;

const SAMLFederation = async ({ db }: { db: DatabaseStore }) => {
  const appStore = db.store('samlfed:apps');
  const sessionStore = db.store('samlfed:session');
  const connectionStore = db.store('saml:config');

  const app = new App({ store: appStore });
  const sso = new SSOHandler({ app, sessionStore, connectionStore });

  return {
    app,
    sso,
  };
};

export default SAMLFederation;
