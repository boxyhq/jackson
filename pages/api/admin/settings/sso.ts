import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';
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
  const { connectionAPIController } = await jackson();
  const { tenant, product } = adminPortalSSODefaults;

  const systemConnections = await connectionAPIController.getConnections({
    tenant,
    product,
  });

  return res.json({ data: systemConnections });
};

export default checkSession(handler);
