import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import type { SetupLinkService } from '@boxyhq/saml-jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, POST');
        res.status(405).json({
          error: { message: `Method ${req.method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    res.status(statusCode).json({ error: { message } });
  }
}

// Get the setup link by tenant + product + service
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { tenant, product, service } = req.query as {
    tenant: string;
    product: string;
    service: SetupLinkService;
  };

  if (!tenant || !product || !service) {
    throw new Error('Must provide tenant, product, and service');
  }

  const { data: setupLinks } = await setupLinkController.filterBy({
    tenant,
    product,
    service,
  });

  res.json({ data: setupLinks[0] });
};

// Create a setup link
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const setupLink = await setupLinkController.create(req.body);

  res.status(201).json({ data: setupLink });
};
