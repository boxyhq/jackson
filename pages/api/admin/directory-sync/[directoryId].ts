import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'PUT':
      return handlePUT(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
};

// Update a directory configuration
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directoryId } = req.query;
  const { directorySync } = await jackson();

  const { name, webhook_url, webhook_secret } = req.body;

  try {
    const directory = await directorySync.directories.update(directoryId as string, {
      name,
      webhook_url,
      webhook_secret,
    });

    return res.status(201).json({ data: directory, error: null });
  } catch (err: any) {
    const { message, statusCode = 500 } = err;

    return res.status(statusCode).json({ data: null, error: { message } });
  }
};

export default checkSession(handler);
