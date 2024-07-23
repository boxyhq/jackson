import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    switch (req.method) {
      case 'GET':
        await handleGET(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;
    res.status(statusCode).json({ error: { message } });
  }
};

// Get Conversation by Id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { chatController } = await jackson();

  const chat = await chatController.getChatByConversationId(req.query.conversationId as string);

  res.json({ data: { chat } });
};

export default handler;
