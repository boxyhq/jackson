import type { NextApiRequest, NextApiResponse } from 'next';
import { extractAuthToken, validateApiKey } from '@lib/utils';
import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (!validateApiKey(extractAuthToken(req))) {
    return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
  }

  switch (method) {
    case 'POST':
      return handlePost(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Create a new SCIM configuration
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scimController } = await jackson();

  const { name, tenant, product, webhook_url, webhook_secret } = req.body;

  try {
    const config = await scimController.create({ name, tenant, product, webhook_url, webhook_secret });

    return res.status(201).json({ data: config, error: null });
  } catch (err: any) {
    const { message, statusCode = 500 } = err;

    return res.status(statusCode).json({ data: null, error: { message } });
  }
};
