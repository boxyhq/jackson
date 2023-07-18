import type { NextApiRequest, NextApiResponse } from 'next';
import type { SetupLinkService } from '@boxyhq/saml-jackson';
import jackson from '@lib/jackson';

const service: SetupLinkService = 'dsync';

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

  const { tenant, product } = req.query as {
    tenant: string;
    product: string;
  };

  if (!tenant || !product) {
    throw new Error('Must provide a tenant and product');
  }

  const { data: setupLinks } = await setupLinkController.filterBy({
    tenant,
    product,
    service,
  });

  // Expecting only one setup link per tenant + product + service combination
  res.json({ data: setupLinks[0] });
};

// Create a setup link
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const setupLink = await setupLinkController.create({
    ...req.body,
    service,
  });

  res.status(201).json({ data: setupLink });
};
