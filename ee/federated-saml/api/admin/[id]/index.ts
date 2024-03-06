import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGET(req, res);
      case 'PATCH':
        return await handlePATCH(req, res);
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

// Get Identity Federation app by id
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

// Update Identity Federation app
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const updatedApp = await samlFederatedController.app.update(req.body);

  return res.status(200).json({ data: updatedApp });
};

// Delete the Identity Federation app
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { id } = req.query as { id: string };

  await samlFederatedController.app.delete({ id });

  return res.status(200).json({ data: {} });
};

export default handler;
