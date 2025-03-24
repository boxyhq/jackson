import { defaultHandler } from '@lib/api';
import { jacksonOptions } from '@lib/env';
import { logger } from '@lib/logger';
import { NextApiRequest, NextApiResponse } from 'next';
import defaultDb from 'npm/src/db/defaultDb';
import DB from 'npm/src/db/db';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    GET: handleGET,
  });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // store the cert info like thumprint, valid until with details like tenant, product, client id
    const _opts = defaultDb(jacksonOptions);
    const db = await DB.new({ db: _opts.db, logger });
    const notifcationEventStore = db.store('cert:info');

    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const allCerts = await notifcationEventStore.getAll();
    const expiringCerts = allCerts.data.filter((cert) => {
      const validToDate = new Date(cert.validTo);
      return validToDate <= threeMonthsFromNow && validToDate >= new Date();
    });

    return res.json({ result: expiringCerts });
  } catch (error) {
    console.log(error);
  }
};

export default handler;
