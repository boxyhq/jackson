import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { adminHandler } from '@lib/api/adminHandler';
import { ApiError } from 'next/dist/server/api-utils';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await adminHandler(req, res, {
    GET: handleGET,
  });
};

// Get the details of a user
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId, userId } = req.query as { directoryId: string; userId: string };

  const { data: directory, error } = await directorySyncController.directories.get(directoryId);

  if (error) {
    throw new ApiError(error.code, error.message);
  }

  const { data: user, error: userError } = await directorySyncController.users
    .setTenantAndProduct(directory.tenant, directory.product)
    .get(userId);

  if (userError) {
    throw new ApiError(userError.code, userError.message);
  }

  res.json({ data: user });
};

export default handler;
