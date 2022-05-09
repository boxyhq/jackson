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
      return handleGet(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Get SCIM configuration by id
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scimController } = await jackson();

  const { id } = req.query;

  try {
    const config = await scimController.get(id as string);

    return res.status(201).json({ data: config, error: null });
  } catch (err: any) {
    const { message, statusCode = 500 } = err;

    return res.status(statusCode).json({ data: null, error: { message } });
  }
};
