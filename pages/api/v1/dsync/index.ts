import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await handleGET(req, res);
    case 'POST':
      return await handlePOST(req, res);
    default:
      res.setHeader('Allow', 'GET, POST');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
}

// Get the configuration
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { tenant, product } = req.query;

  if (!tenant || !product) {
    return res.status(400).json({ error: { message: 'Please provide tenant and product' } });
  }

  const { data, error } = await directorySyncController.directories.getByTenantAndProduct(
    tenant as string,
    product as string
  );

  if (error) {
    return res.status(error.code).json({ error });
  }

  return res.status(200).json({ data });
};

// Create a new configuration
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { data, error } = await directorySyncController.directories.create(req.body);

  if (error) {
    return res.status(error.code).json({ error });
  }

  return res.status(201).json({ data });
};
