import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await handleGET(req, res);
    default:
      res.setHeader('Allow', 'GET');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
}

// Get the groups
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { tenant, product, directoryId, offset, limit } = req.query as {
    tenant: string;
    product: string;
    directoryId: string;
    offset?: string;
    limit?: string;
  };

  const pageOffset = parseInt(offset || '0');
  const pageLimit = parseInt(limit || '15');

  const { data, error } = await directorySyncController.groups
    .setTenantAndProduct(tenant, product)
    .getAll({ directoryId, pageLimit, pageOffset });

  if (error) {
    return res.status(error.code).json({ error });
  }

  return res.status(200).json({ data });
};
