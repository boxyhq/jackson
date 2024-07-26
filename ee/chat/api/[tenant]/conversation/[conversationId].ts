import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { defaultHandler } from '@lib/api';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    GET: handleGET,
  });
};

// Get Chat Thread by Conversation ID
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { chatController } = await jackson();

  const chat = await chatController.getChatThreadByConversationId(req.query.conversationId as string);

  res.json({ data: { chat } });
};

export default handler;
