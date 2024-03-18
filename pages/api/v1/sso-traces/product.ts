import jackson from '@lib/jackson';
import { parsePaginateApiParams } from '@lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGET(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;
    res.status(statusCode).json({ error: { message } });
  }
}

// Get the sso traces filtered by the product
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { adminController } = await jackson();

  const { product } = req.query as {
    product: string;
  };

  const { pageOffset, pageLimit, pageToken } = parsePaginateApiParams(req.query);

  const traces = await adminController.getTracesByProduct(product, pageOffset, pageLimit, pageToken);

  res.json(traces);
};
