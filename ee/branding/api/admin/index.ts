import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

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

  const { logoUrl, faviconUrl, companyName, primaryColor } = req.body;

  return res.json({
    data: await brandingController.update({ logoUrl, faviconUrl, companyName, primaryColor }),
  });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { brandingController } = await jackson();

  return res.json({ data: await brandingController.get() });
};

export default handler;
