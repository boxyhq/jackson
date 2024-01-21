import jackson from '@lib/jackson';
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

// Get the saml traces filtered by the product
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { adminController } = await jackson();

  const { product, pageOffset, pageLimit, pageToken } = req.query as {
    product: string;
    pageOffset: string;
    pageLimit: string;
    pageToken?: string;
  };

  const traces = await adminController.getTracesByProduct(
    product,
    parseInt(pageOffset),
    parseInt(pageLimit),
    pageToken
  );

  res.json(traces);
};
