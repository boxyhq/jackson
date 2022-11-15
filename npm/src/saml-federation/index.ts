import type { Storable } from '../typings';
import { App } from './app';
import { SAMLHandler } from './sso';

export type SAMLFederation = Awaited<ReturnType<typeof SAMLFederation>>;

const SAMLFederation = async ({ store }: { store: Storable }) => {
  const app = new App({ store });
  const sso = new SAMLHandler({ app });

  return {
    app,
    sso,
  };
};

export default SAMLFederation;
