import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { defaultHandler } from '@lib/api';
import { terminusOptions } from '@lib/env';
import { getServerSession } from 'next-auth';
import { authOptions } from 'pages/api/auth/[...nextauth]';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    GET: handleGET,
  });
};

// Get Chat Thread by Conversation ID
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { chatController } = await jackson();
  const { tenant } = req.query;

  let userId;
  const isAdminPortalTenant = tenant === terminusOptions.llm?.tenant;
  if (isAdminPortalTenant) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }
    userId = session.user.id;
  } else {
    // userId = req.body.userId;
  }

  const chat = await chatController.getChatThreadByConversationId(req.query.conversationId as string, userId);

  if (chat) res.json({ data: chat });
};

export default handler;
