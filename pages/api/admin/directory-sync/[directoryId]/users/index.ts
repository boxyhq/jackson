import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { adminHandler } from '@lib/api/adminHandler';
import { ApiError } from '@lib/error';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await adminHandler(req, res, {
    GET: handleGET,
  });
};

// Get all users in a directory
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId, offset, limit } = req.query as { directoryId: string; offset: string; limit: string };

  const { data: directory, error } = await directorySyncController.directories.get(directoryId);

  if (error) {
    throw new ApiError(error.code, error.message);
  }

  const pageOffset = parseInt(offset);
  const pageLimit = parseInt(limit);

  const { data: users, error: usersError } = await directorySyncController.users
    .setTenantAndProduct(directory.tenant, directory.product)
    .getAll({ pageOffset, pageLimit, directoryId });

  if (usersError) {
    throw new ApiError(usersError.code, usersError.message);
  }

  res.json({ data: users });
};

export default handler;
