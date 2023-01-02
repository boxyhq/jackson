import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGET(req, res);
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
}

// Check License key
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { checkLicense } = await jackson();

  const hasValidLicense = await checkLicense();

  return res.status(200).json({ data: { status: hasValidLicense } });
};
