import type { NextApiRequest, NextApiResponse } from 'next';
import type { SetupLinkService } from '@boxyhq/saml-jackson';
import jackson from '@lib/jackson';
import { parsePaginateApiParams } from '@lib/utils';

const service: SetupLinkService = 'dsync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGET(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({
          error: { message: `Method ${req.method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    res.status(statusCode).json({ error: { message } });
  }
}

// Get the setup links filtered by the product
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { product } = req.query as {
    product: string;
  };

  if (!product) {
    throw new Error('Please provide a product');
  }

  const { pageOffset, pageLimit, pageToken } = parsePaginateApiParams(req.query);

  const setupLinks = await setupLinkController.filterBy({
    product,
    service,
    pageOffset,
    pageLimit,
    pageToken,
  });

  res.json(setupLinks);
};
