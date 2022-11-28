import type { NextApiRequest, NextApiResponse } from 'next';

import { checkSession } from '@lib/middleware';
import jackson from '@lib/jackson';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { checkLicense } = await jackson();

  if (!(await checkLicense())) {
    return res.status(404).json({
      error: { message: 'License not found. Please add a valid license to use this feature.' },
    });
  }

  const { method } = req;

  switch (method) {
    case 'POST':
      return handlePOST(req, res);
    case 'GET':
      return handleGET(req, res);

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
};

// Create new SAML Federation app
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { name, tenant, product, acsUrl, entityId } = req.body;

  try {
    const app = await samlFederatedController.app.create({
      name,
      tenant,
      product,
      acsUrl,
      entityId,
    });

    return res.status(201).json({ data: app });
  } catch (error: any) {
    const { message, statusCode } = error;

    return res.status(statusCode).json({
      error: { message },
    });
  }
};

// Get SAML Federation apps
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  try {
    const apps = await samlFederatedController.app.getAll();

    res.status(200).json({ data: apps });
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    res.status(statusCode).json({
      error: { message },
    });
  }
};

export default checkSession(handler);
