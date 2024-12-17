import type { SAMLJackson } from '@boxyhq/saml-jackson';

import jackson from '@boxyhq/saml-jackson';
import { jacksonOptions } from '@lib/env';
import '@lib/metrics';

const g = global as any;

export default async function init() {
  if (!g.jacksonInstance) {
    g.jacksonInstance = new Promise((resolve, reject) => {
      jackson(jacksonOptions).then(resolve).catch(reject);
    });
  }

  return (await g.jacksonInstance) as Promise<SAMLJackson>;
}
