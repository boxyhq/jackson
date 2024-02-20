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

// Get the users
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const searchParams = req.query as {
    tenant: string;
    product: string;
    directoryId: string;
    offset: string;
    limit: string;
    pageToken: string;
  };

  let tenant = searchParams.tenant || '';
  let product = searchParams.product || '';

  // If tenant and product are not provided, retrieve the from directory
  if ((!tenant || !product) && searchParams.directoryId) {
    const { data: directory } = await directorySyncController.directories.get(searchParams.directoryId);

    if (!directory) {
      return res.status(404).json({ error: { message: 'Directory not found.' } });
    }

    tenant = directory.tenant;
    product = directory.product;
  }

  const { data, error } = await directorySyncController.users.setTenantAndProduct(tenant, product).getAll({
    pageOffset: parseInt(searchParams.offset || '0'),
    pageLimit: parseInt(searchParams.limit || '15'),
    pageToken: searchParams.pageToken || undefined,
    directoryId: searchParams.directoryId,
  });

  if (error) {
    return res.status(error.code).json({ error });
  }

  return res.status(200).json({ data });
};
