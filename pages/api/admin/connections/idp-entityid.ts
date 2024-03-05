import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { adminHandler } from '@lib/api/adminHandler';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await adminHandler(req, res, {
    GET: handleGET,
  });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  const idpEntityID = connectionAPIController.getIDPEntityID({
    tenant: req.body.tenant,
    product: req.body.product,
  });

  res.json({ data: { idpEntityID } });
};

export default handler;
