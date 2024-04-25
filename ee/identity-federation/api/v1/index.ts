import { AppRequestParams } from '@boxyhq/saml-jackson';
import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'POST':
        await handlePOST(req, res);
        break;
      case 'GET':
        await handleGET(req, res);
        break;
      case 'PATCH':
        await handlePATCH(req, res);
        break;
      case 'DELETE':
        await handleDELETE(req, res);
        break;
      default:
        res.setHeader('Allow', 'POST, GET, PATCH, DELETE');
        res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;
    res.status(statusCode).json({ error: { message } });
  }
}

// Create a SAML federated app
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const app = await samlFederatedController.app.create(req.body);

  res.status(201).json({ data: app });
};

// Get a SAML federated app by ID
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const app = await samlFederatedController.app.get(req.query as AppRequestParams);

  res.json({ data: app });
};

// Update a SAML federated app
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const app = await samlFederatedController.app.update(req.body);

  res.json({ data: app });
};

// Delete a SAML federated app
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  await samlFederatedController.app.delete(req.query as AppRequestParams);

  res.json({ data: {} });
};
