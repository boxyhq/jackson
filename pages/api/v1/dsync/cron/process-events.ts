import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

// Process the dsync events queue in Jackson
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { directorySyncController } = await jackson();

    await directorySyncController.events.batch.process();

    res.status(200).json({ message: 'Processing completed' });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Processing failed' });
  }
};

export default handler;
