import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  await directorySyncController.sync();

  return res.status(200).json({ message: 'Sync completed' });
};

export default handler;
