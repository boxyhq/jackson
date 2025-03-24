import { defaultHandler } from '@lib/api';
import { jacksonOptions } from '@lib/env';
import jackson from '@lib/jackson';
import { logger } from '@lib/logger';
import { parsePaginateApiParams } from '@lib/utils';
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
    // get all connections
    const { adminController } = await jackson();
    const { pageOffset, pageLimit, pageToken } = parsePaginateApiParams(req.query);
    const paginatedConnectionList = await adminController.getAllConnection(pageOffset, pageLimit, pageToken);

    // store the cert info like thumprint, valid until with details like tenant, product, client id
    const _opts = defaultDb(jacksonOptions);
    const db = await DB.new({ db: _opts.db, logger });
    const notifcationEventStore = db.store('cert:info');
    await notifcationEventStore.deleteMany();

    paginatedConnectionList.data.map(async (conn) => {
      const tenant = conn.tenant;
      const product = conn.product;
      const idpMetadata = conn.idpMetadata;
      const validToArr = idpMetadata.validTo.split(',');
      idpMetadata.thumbprint.split(',').forEach(async (element, i) => {
        const dbObj = {
          thumbprint: element,
          tenant: tenant,
          product: product,
          clientId: conn.clientID,
          validTo: validToArr[i],
        };
        const keyId = `${conn.clientID}:${element}`;
        await notifcationEventStore.put(keyId, dbObj);
      });
    });

    const result = await notifcationEventStore.getAll();

    return res.json({ result });
  } catch (error) {
    console.log(error);
  }
};

export default handler;
