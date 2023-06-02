import type { NextApiRequest, NextApiResponse } from 'next';
import type { DirectorySyncEvent } from '@boxyhq/saml-jackson';

import jackson from '@lib/jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  try {
    await directorySyncController.sync(directorySyncController.events.callback);

    return res.status(200).json({ message: 'Sync completed' });
  } catch (e: any) {
    return res.status(500).json({ message: e.message || 'Sync failed' });
  }
};

export default handler;
