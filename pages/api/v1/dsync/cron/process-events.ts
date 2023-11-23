import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { validateApiKey } from '@lib/auth';

// Process the dsync events queue in Jackson
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { apiKey } = req.query as { apiKey: string };

  try {
    if (validateApiKey(apiKey) === false) {
      throw new Error('Please provide a valid Jackson API key');
    }

    const { directorySyncController } = await jackson();

    await directorySyncController.events.batch.process();

    res.status(200).json({ message: 'Processing completed' });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Processing failed' });
  }
};

export default handler;
