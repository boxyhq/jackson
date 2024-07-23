import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    switch (req.method) {
      case 'GET':
        await handleGET(req, res);
        break;
      default:
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;
    res.status(statusCode).json({ error: { message } });
  }
};

// Get Conversations
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { chatController } = await jackson();

  await chatController.get(req.body);

  res.end();
};

export default handler;
