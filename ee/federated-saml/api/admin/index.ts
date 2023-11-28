import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import retraced from '@ee/retraced';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        return await handlePOST(req, res);
      case 'GET':
        return await handleGET(req, res);
      default:
        res.setHeader('Allow', 'POST, GET');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

// Create new SAML Federation app
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const app = await samlFederatedController.app.create(req.body);

  retraced.reportAdminPortalEvent({
    action: 'federation.app.create',
    crud: 'c',
    req,
    target: {
      id: app.id,
    },
  });

  return res.status(201).json({ data: app });
};

// Get SAML Federation apps
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { offset, limit, pageToken } = req.query as { offset: string; limit: string; pageToken?: string };

  const pageOffset = parseInt(offset);
  const pageLimit = parseInt(limit);

  const apps = await samlFederatedController.app.getAll({ pageOffset, pageLimit, pageToken });

  if (apps.pageToken) {
    res.setHeader('jackson-pagetoken', apps.pageToken);
  }

  retraced.reportAdminPortalEvent({
    action: 'federation.app.list',
    crud: 'r',
    req,
  });

  return res.json({ data: apps.data });
};

export default handler;
