import tap from 'tap';

import { jacksonOptions } from '../../utils';
import { IDirectorySyncController, Directory } from '../../../src/typings';

let directory: Directory;
let directorySync: IDirectorySyncController;

tap.before(async () => {
  const jackson = await (await import('../../../src/index')).default(jacksonOptions);

  directorySync = jackson.directorySyncController;
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('Process bulk webhook events', async (t) => {
  await directorySync.events.sendBatchToWebhooks();

  t.pass('ok');
  t.end();
});
