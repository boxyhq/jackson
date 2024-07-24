import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { defaultHandler } from '@lib/api';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    GET: handleGET,
  });
};

// Get Conversations
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { chatController } = await jackson();

  const conversations = await chatController.getConversationsByTenantAndUser({
    tenant: req.query.tenant as string,
    userId: req.query.userId as string,
  });

  res.json({ data: { conversations } });
};

export default handler;
