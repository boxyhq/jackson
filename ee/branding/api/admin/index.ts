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

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { brandingController } = await jackson();

  const brandingUpdated = await brandingController.update(req.body);

  retraced.reportAdminPortalEvent({
    action: 'portal.branding.update',
    crud: 'u',
    req,
  });

  return res.json({
    data: brandingUpdated,
  });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { brandingController } = await jackson();

  return res.json({ data: await brandingController.get() });
};

export default handler;
