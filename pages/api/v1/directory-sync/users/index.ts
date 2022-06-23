import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Get the users
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { tenant, product } = req.query;

  try {
    const users = await directorySyncController.users
      .setTenantAndProduct(<string>tenant, <string>product)
      .list({});

    return res.status(200).json({ data: users, error: null });
  } catch (err: any) {
    const { message, statusCode = 500 } = err;

    return res.status(statusCode).json({ data: null, error: { message } });
  }
};
