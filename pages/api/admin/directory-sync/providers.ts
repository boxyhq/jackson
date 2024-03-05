import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { adminHandler } from '@lib/api/adminHandler';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await adminHandler(req, res, {
    GET: handleGET,
  });
};

// Get the directory providers
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const providers = directorySyncController.providers();

  res.json({ data: providers });
};

export default handler;
