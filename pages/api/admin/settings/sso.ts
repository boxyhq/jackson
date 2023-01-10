import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { adminPortalSSODefaults } from '@lib/env';

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

// Get the admin portal sso connections
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { adminController } = await jackson();
  const { tenant, product } = adminPortalSSODefaults;

  const { pageOffset, pageLimit } = req.query as {
    pageOffset: string;
    pageLimit: string;
  };

  const systemConnections = (
    await adminController.getAllConnection(+(pageOffset || 0), +(pageLimit || 0))
  ).filter((conn) => conn.tenant === tenant && conn.product === product);

  return res.json({ data: systemConnections });
};

export default handler;
