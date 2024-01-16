import tap from 'tap';
import { jacksonOptions } from './utils';
import { ISetupLinkController } from 'npm/src';

let setupLinkController: ISetupLinkController;
const product = 'jackson';

tap.before(async () => {
  const jackson = await (await import('../src/index')).default(jacksonOptions);
  setupLinkController = jackson.setupLinkController;
});

tap.teardown(async () => {
  process.exit(0);
});

const expireInDays = (timestamp: number) => {
  const diffInMilliseconds = timestamp - new Date().getTime();
  const expireInDays = Math.ceil(diffInMilliseconds / (1000 * 3600 * 24));
  return expireInDays;
};

tap.test('Setup link controller', async (t) => {
  t.test('Create a new setup link', async (t) => {
    const setupLink = await setupLinkController.create({
      tenant: 'tenant-1',
      product,
      service: 'dsync',
    });

    t.ok(setupLink);
    t.match(expireInDays(setupLink.validTill), 3);
  });

  // With custom expiry
  t.test('Create a new setup link with custom expiry', async (t) => {
    const setupLink = await setupLinkController.create({
      tenant: 'tenant-2',
      product,
      service: 'dsync',
      expiryDays: 5,
    });

    t.ok(setupLink);
    t.match(expireInDays(setupLink.validTill), 5);
  });

  // With global expiry
  t.test('Create a new setup link with global expiry', async (t) => {
    const jackson = await (
      await import('../src/index')
    ).default({
      ...jacksonOptions,
      setupLinkExpiryDays: 10,
    });

    setupLinkController = jackson.setupLinkController;

    const setupLink = await setupLinkController.create({
      tenant: 'tenant-3',
      product,
      service: 'dsync',
    });

    t.ok(setupLink);
    t.match(expireInDays(setupLink.validTill), 10);
  });
});
