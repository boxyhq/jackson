import { defaultHandler } from '@lib/api';
import { isLLMChatEnabled } from '@lib/env';
import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    GET: handleGET,
  });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  res.json({ data: { enabled: isLLMChatEnabled } });
};

export default handler;
