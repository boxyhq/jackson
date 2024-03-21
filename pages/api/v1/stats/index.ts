import jackson from '@lib/jackson';
import { NextApiRequest, NextApiResponse } from 'next';
import { IndexNames } from 'npm/src/controller/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGET(req, res);
      case 'POST':
        return await handlePOST(req, res);
      default:
        res.setHeader('Allow', 'GET, POST');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
}

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController, directorySyncController } = await jackson();

  const sso_connections_count = await connectionAPIController.getCount();
  const dsync_connections_count = await directorySyncController.directories.getCount();

  return res.json({
    data: {
      sso_connections: sso_connections_count,
      dsync_connections: dsync_connections_count,
    },
  });
};

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController, directorySyncController } = await jackson();

  // Products must be an array of strings
  const products = req.body.products as string[];
  const type = req.body.type ? (req.body.type as 'sso' | 'dsync') : undefined;

  // Validate products
  if (!products) {
    throw { message: 'Missing products', statusCode: 400 };
  } else if (!Array.isArray(products)) {
    throw { message: 'Products must be an array', statusCode: 400 };
  } else if (products.length > 50) {
    throw { message: 'Products must not exceed 50', statusCode: 400 };
  } else {
    // Get counts for product
    // If type is not provided, get counts for both sso and dsync
    const ssoPromises =
      !type || type === 'sso'
        ? products.map((product) =>
            connectionAPIController.getCount({ name: IndexNames.Product, value: product })
          )
        : [];
    const dsyncPromises =
      !type || type === 'dsync'
        ? products.map((product) =>
            directorySyncController.directories.getCount({ name: IndexNames.Product, value: product })
          )
        : [];

    const ssoCounts = await Promise.all(ssoPromises);
    const dsyncCounts = await Promise.all(dsyncPromises);

    // reduce the outputs and calculate final count
    const sso_connections_count = ssoCounts.reduce((a, b) => (a || 0) + (b || 0), 0);
    const dsync_connections_count = dsyncCounts.reduce((a, b) => (a || 0) + (b || 0), 0);

    return res.json({
      data: {
        sso_connections: sso_connections_count,
        dsync_connections: dsync_connections_count,
      },
    });
  }
};
