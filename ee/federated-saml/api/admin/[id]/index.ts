import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import type { SAMLFederationApp } from '@boxyhq/saml-jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGET(req, res);
      case 'PUT':
        return await handlePUT(req, res);
      case 'DELETE':
        return await handleDELETE(req, res);
      default:
        res.setHeader('Allow', 'GET, PUT, DELETE');
        res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({
      error: { message },
    });
  }
};

// Get SAML Federation app by id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { id } = req.query as { id: string };

  const app = await samlFederatedController.app.get({ id });
  const metadata = await samlFederatedController.app.getMetadata();

  return res.status(200).json({
    data: {
      ...app,
      metadata,
    },
  });
};

// Update SAML Federation app
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { id } = req.query as { id: string };
  const { name, acsUrl, entityId, logoUrl, faviconUrl, primaryColor } = req.body as Pick<
    SAMLFederationApp,
    'acsUrl' | 'entityId' | 'name' | 'logoUrl' | 'faviconUrl' | 'primaryColor'
  >;

  const updatedApp = await samlFederatedController.app.update(id, {
    name,
    acsUrl,
    entityId,
    logoUrl,
    faviconUrl,
    primaryColor,
  });

  return res.status(200).json({ data: updatedApp });
};

// Delete the SAML Federation app
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { id } = req.query as { id: string };

  await samlFederatedController.app.delete({ id });

  return res.status(200).json({ data: {} });
};

export default handler;
