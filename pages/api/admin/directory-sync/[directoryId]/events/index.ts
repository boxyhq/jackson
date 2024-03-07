import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { defaultHandler } from '@lib/api';
import { ApiError } from '@lib/error';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    GET: handleGET,
    DELETE: handleDELETE,
  });
};

// Get all events
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId, offset, limit } = req.query as { directoryId: string; offset: string; limit: string };

  const { data: directory, error } = await directorySyncController.directories.get(directoryId);

  if (error) {
    throw new ApiError(error.message, error.code);
  }

  const pageOffset = parseInt(offset);
  const pageLimit = parseInt(limit);

  const events = await directorySyncController.webhookLogs
    .setTenantAndProduct(directory.tenant, directory.product)
    .getAll({
      pageOffset,
      pageLimit,
      directoryId,
    });

  res.json({ data: events });
};

// Delete all events
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { data: directory, error } = await directorySyncController.directories.get(directoryId);

  if (error) {
    throw new ApiError(error.message, error.code);
  }

  await directorySyncController.webhookLogs
    .setTenantAndProduct(directory.tenant, directory.product)
    .deleteAll(directoryId);

  res.json({ data: null });
};

export default handler;
