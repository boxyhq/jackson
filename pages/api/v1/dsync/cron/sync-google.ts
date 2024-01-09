import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

// Sync Google Workspace with Jackson
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { directorySyncController } = await jackson();

    await directorySyncController.sync(directorySyncController.events.callback);

    res.status(200).json({ message: 'Sync completed' });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Sync failed' });
  }
};

export default handler;
