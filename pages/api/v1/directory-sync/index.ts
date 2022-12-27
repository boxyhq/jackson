import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    case 'POST':
      return handlePOST(req, res);
    default:
      res.setHeader('Allow', 'GET, POST');
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Get the configurations
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { tenant, product } = req.query;

  // If tenant and product are specified, get the configuration by tenant and product
  if (tenant && product) {
    const { data, error } = await directorySyncController.directories.getByTenantAndProduct(
      tenant as string,
      product as string
    );

    return res.status(error ? error.code : 200).json({ data, error });
  }

  // otherwise, get all configurations
  const { data, error } = await directorySyncController.directories.list({});

  return res.status(error ? error.code : 200).json({ data, error });
};

// Create a new configuration
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { name, tenant, type, product, webhook_url, webhook_secret } = req.body;

  const { data, error } = await directorySyncController.directories.create({
    name,
    tenant,
    product,
    type,
    webhook_url,
    webhook_secret,
  });

  return res.status(error ? error.code : 201).json({ data, error });
};
