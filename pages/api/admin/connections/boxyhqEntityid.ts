import type { NextApiRequest, NextApiResponse } from 'next';
import jackson, { GetEntityIDBody } from '@lib/jackson';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();
  const entityID = await connectionAPIController.getEntityID({
    tenant: req.body.tenant,
    product: req.body.product,
  } as GetEntityIDBody);
  return res.json({
    boxyhqEntityID: entityID,
  });
};

export default handler;
