'use server';

import { jacksonOptions } from '@lib/env';
import { logger } from '@lib/logger';
import { Storable } from 'npm/src';
import defaultDb from 'npm/src/db/defaultDb';
import DB from 'npm/src/db/db';

const g = global as any;

export async function initCertInfoDB(): Promise<Storable> {
  if (!g.certInfoStore) {
    const _opts = defaultDb(jacksonOptions);
    const db = await DB.new({ db: _opts.db, logger });
    g.certInfoStore = db.store('cert:info');
  }
  return g.certInfoStore as Storable;
}

export default function NotificationAdapter() {
  const store = (async () => await initCertInfoDB())();
  return {
    async getExpiredCertificates() {
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      const allCerts = await (await store).getAll();
      const expiringCerts = allCerts.data.filter((cert) => {
        const validToDate = new Date(cert.validTo);
        return validToDate <= threeMonthsFromNow && validToDate >= new Date();
      });

      return expiringCerts;
    },
    async getConnectionsByTenantAndProduct() {
      return [];
    },
  };
}
