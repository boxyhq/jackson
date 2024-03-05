import jackson from '@lib/jackson';
import { parsePaginateApiParams } from '@lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGET(req, res);
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
}

// Get the connections filtered by the product
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { product } = req.query as {
    product: string;
  };

  if (!product) {
    throw new Error('Please provide a product');
  }

  const { pageOffset, pageLimit, pageToken } = parsePaginateApiParams(req.query);

  const connections = await directorySyncController.directories.filterBy({
    product,
    pageOffset,
    pageLimit,
    pageToken,
  });

  return res.status(200).json(connections);
};
