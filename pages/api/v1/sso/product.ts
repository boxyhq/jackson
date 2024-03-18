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
  const { connectionAPIController } = await jackson();

  const { product } = req.query as {
    product: string;
  };

  const { pageOffset, pageLimit, pageToken } = parsePaginateApiParams(req.query);

  const connections = await connectionAPIController.getConnectionsByProduct({
    product,
    pageOffset,
    pageLimit,
    pageToken,
  });

  return res.status(200).json(connections.data);
};
