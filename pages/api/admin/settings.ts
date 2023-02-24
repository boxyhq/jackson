import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        return handlePOST(req, res);
      case 'GET':
        return handleGET(req, res);
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
  const { settingsController } = await jackson();

  const { branding } = req.body;

  const settings = await settingsController.update({
    branding,
  });

  return res.json({ data: settings });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { settingsController } = await jackson();

  const settings = await settingsController.get();

  return res.json({ data: settings });
};

export default handler;
