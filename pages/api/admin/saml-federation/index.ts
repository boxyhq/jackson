import type { NextApiRequest, NextApiResponse } from 'next';

import { checkSession } from '@lib/middleware';
import jackson from '@lib/jackson';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'POST':
      return handlePOST(req, res);
    case 'GET':
      return handleGET(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
};

// Create new SAML Federation app
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederation } = await jackson();

  const { tenant, product, acsUrl, entityId } = req.body;

  try {
    const { data } = await samlFederation.app.create({
      tenant,
      product,
      acsUrl,
      entityId,
    });

    return res.status(201).json({ data });
  } catch (error: any) {
    const { message, statusCode } = error;

    return res.status(statusCode).json({
      error: { message },
    });
  }
};

// Get SAML Federation apps
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederation } = await jackson();

  try {
    const { data } = await samlFederation.app.getAll();

    return res.status(200).json({ data });
  } catch (error: any) {
    const { message, statusCode } = error;

    return res.status(statusCode).json({
      error: { message },
    });
  }
};

export default checkSession(handler);
