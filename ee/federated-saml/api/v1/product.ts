import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { parsePaginateApiParams } from '@lib/utils';

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

// Get SAML federated apps filtered by the product
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { product } = req.query as {
    product: string;
  };

  const { pageOffset, pageLimit, pageToken } = parsePaginateApiParams(req.query);

  const apps = await samlFederatedController.app.getByProduct({
    product,
    pageOffset,
    pageLimit,
    pageToken,
  });

  res.json(apps);
};
