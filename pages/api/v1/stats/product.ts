import jackson from '@lib/jackson';
import { NextApiRequest, NextApiResponse } from 'next';
import { IndexNames } from 'npm/src/controller/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        return await handlePOST(req, res);
      default:
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
}

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
    let sso_connections_count = 0;
    let dsync_connections_count = 0;

    for (const product of products) {
      if (product) {
        if (!type || type === 'sso') {
          const count = await connectionAPIController.getCount({ name: IndexNames.Product, value: product });
          sso_connections_count += count || 0;
        }

        if (!type || type === 'dsync') {
          const count = await directorySyncController.directories.getCount({
            name: IndexNames.Product,
            value: product,
          });
          dsync_connections_count += count || 0;
        }
      }
    }

    return res.json({
      data: {
        sso_connections: sso_connections_count,
        dsync_connections: dsync_connections_count,
      },
    });
  }
};
