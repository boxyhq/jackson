import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // TODO: Add authentication

  switch (method) {
    case 'POST':
      return handlePOST(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Create a new configuration
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySync } = await jackson();

  const { name, tenant, product, webhook_url, webhook_secret } = req.body;

  try {
    const directory = await directorySync.directories.create({
      name,
      tenant,
      product,
      webhook_url,
      webhook_secret,
    });

    return res.status(201).json({ data: directory, error: null });
  } catch (err: any) {
    const { message, statusCode = 500 } = err;

    return res.status(statusCode).json({ data: null, error: { message } });
  }
};
