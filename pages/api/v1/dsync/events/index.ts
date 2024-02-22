import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'DELETE':
        await handleDELETE(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, DELETE');
        res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;
    return res.status(statusCode).json({ error: { message } });
  }
}

// Get webhook events
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

  const events = await directorySyncController.webhookLogs.setTenantAndProduct(tenant, product).getAll({
    pageOffset: parseInt(searchParams.offset || '0'),
    pageLimit: parseInt(searchParams.limit || '15'),
    pageToken: searchParams.pageToken || undefined,
    directoryId: searchParams.directoryId,
  });

  return res.json({ data: events });
};

// Delete webhook events for a directory
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as {
    directoryId: string;
  };

  const { data: directory, error } = await directorySyncController.directories.get(directoryId);

  if (error) {
    return res.status(error.code).json({ error });
  }

  await directorySyncController.webhookLogs
    .setTenantAndProduct(directory.tenant, directory.product)
    .deleteAll(directory.id);

  return res.json({ data: null });
};
