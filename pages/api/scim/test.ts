import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  await directorySyncController.events.batch.process();

  res.send('ok');
};

export default handler;
