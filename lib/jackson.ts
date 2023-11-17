import type { SAMLJackson } from '@npm/src/index';

import jackson from '@npm/src/index';
import { jacksonOptions } from '@lib/env';
import '@lib/metrics';

const g = global as any;

export default async function init() {
  if (!g.jacksonInstance) {
    g.jacksonInstance = await jackson(jacksonOptions);
  }

  return g.jacksonInstance as SAMLJackson;
}
