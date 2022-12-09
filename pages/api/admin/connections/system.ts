import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';

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

// Create a new configuration
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController } = await jackson();

  const systemConnections = await connectionAPIController.getConnections({
    tenant: process.env.NEXT_PUBLIC_ADMIN_PORTAL_TENANT || '_jackson_boxyhq',
    product: process.env.NEXT_PUBLIC_ADMIN_PORTAL_PRODUCT || '_jackson_admin_portal',
  });

  return res.json(systemConnections);
};

export default checkSession(handler);
