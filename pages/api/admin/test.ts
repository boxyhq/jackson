import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await handleGET(req, res);
    default:
      res.setHeader('Allow', 'POST, GET');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  await directorySyncController.events.sendBatchToWebhooks();

  res.send('ok');
};

export default handler;
