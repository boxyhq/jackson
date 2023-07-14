import type { NextApiRequest, NextApiResponse } from 'next';
import { getPortalBranding } from '@lib/settings';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGET(req, res);
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.json({ data: await getPortalBranding() });
};

export default handler;
