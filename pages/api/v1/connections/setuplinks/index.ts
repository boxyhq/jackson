import type { NextApiRequest, NextApiResponse } from 'next';
import type { SetupLinkService } from '@boxyhq/saml-jackson';
import jackson from '@lib/jackson';

const service: SetupLinkService = 'sso';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'POST':
        await handlePOST(req, res);
        break;
      case 'DELETE':
        await handleDELETE(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, POST, DELETE');
        res.status(405).json({
          error: { message: `Method ${req.method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    res.status(statusCode).json({ error: { message } });
  }
}

// Get the setup link by ID or (tenant + product + service) combination
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { id, tenant, product } = req.query as {
    id: string;
    tenant: string;
    product: string;
  };

  // Get by id
  if (id) {
    const setupLink = await setupLinkController.get(id);

    res.json({ data: setupLink });
  }

  // Get by tenant + product
  if (tenant && product) {
    const { data: setupLinks } = await setupLinkController.filterBy({
      tenant,
      product,
      service,
    });

    res.json({ data: setupLinks[0] });
  }
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

// Delete a setup link by ID or (tenant + product + service) combination
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { id, tenant, product } = req.query as {
    id: string;
    tenant: string;
    product: string;
  };

  if (id) {
    await setupLinkController.remove({ id });
  } else if (service && tenant && product) {
    await setupLinkController.remove({ service, tenant, product });
  }

  res.json({ data: {} });
};
