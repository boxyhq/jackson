import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { validateApiKey } from '@lib/auth';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { apiKey } = req.query as { apiKey: string };

  try {
    if (validateApiKey(apiKey) === false) {
      throw new Error('Please provide a valid Jackson API key');
    }

    const { directorySyncController } = await jackson();

    await directorySyncController.sync(directorySyncController.events.callback);

    res.status(200).json({ message: 'Sync completed' });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Sync failed' });
  }
};

export default handler;
