import type { NextApiRequest, NextApiResponse } from 'next';
import { extractAuthToken, validateApiKey } from '@lib/utils';
import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (!validateApiKey(extractAuthToken(req))) {
    return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
  }

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Get directory by id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySync } = await jackson();

  const { directoryId } = req.query;

  try {
    const directory = await directorySync.directories.get(directoryId as string);

    return res.status(200).json({ data: directory, error: null });
  } catch (err: any) {
    const { message, statusCode = 500 } = err;

    return res.status(statusCode).json({ data: null, error: { message } });
  }
};
