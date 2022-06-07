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
    case 'POST':
      return handlePOST(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Get the configurations
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySync } = await jackson();

  const { tenant, product } = req.query;

  try {
    // If tenant and product are specified, get the configuration by tenant and product
    if (tenant && product) {
      const directory = await directorySync.directories.getByTenantAndProduct(
        tenant as string,
        product as string
      );

      return res.status(200).json({ data: directory, error: null });
    }

    // otherwise, get all configurations
    const directories = await directorySync.directories.list();

    return res.status(200).json({ data: directories, error: null });
  } catch (err: any) {
    const { message, statusCode = 500 } = err;

    return res.status(statusCode).json({ data: null, error: { message } });
  }
};

// Create a new configuration
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySync } = await jackson();

  const { name, tenant, type, product, webhook_url, webhook_secret } = req.body;

  try {
    const directory = await directorySync.directories.create({
      name,
      tenant,
      product,
      type,
      webhook_url,
      webhook_secret,
    });

    return res.status(201).json({ data: directory, error: null });
  } catch (err: any) {
    const { message, statusCode = 500 } = err;

    return res.status(statusCode).json({ data: null, error: { message } });
  }
};
