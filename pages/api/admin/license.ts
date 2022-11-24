import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Check License key
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { checkLicense } = await jackson();

  try {
    const hasValidLicense = await checkLicense();

    res.status(200).json({ data: { status: hasValidLicense } });
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    res.status(statusCode).json({
      error: { message },
    });
  }
};
