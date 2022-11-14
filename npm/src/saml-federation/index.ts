import type { Storable } from '../typings';
import { App } from './app';

const SAMLFederation = async ({ store }: { store: Storable }) => {
  const app = new App({ store });

  return {
    app,
  };
};

export default SAMLFederation;

export type SAMLFederation = Awaited<ReturnType<typeof SAMLFederation>>;
