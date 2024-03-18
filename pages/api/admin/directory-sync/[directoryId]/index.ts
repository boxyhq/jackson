import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import retraced from '@ee/retraced';
import { defaultHandler } from '@lib/api';
import { ApiError } from '@lib/error';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    GET: handleGET,
    PATCH: handlePATCH,
    DELETE: handleDELETE,
  });
};

// Update a directory configuration
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { data, error } = await directorySyncController.directories.update(directoryId, req.body);

  if (data) {
    retraced.reportAdminPortalEvent({
      action: 'dsync.connection.update',
      crud: 'u',
      req,
      target: {
        id: directoryId,
      },
    });
  }

  if (error) {
    throw new ApiError(error.message, error.code);
  }

  res.json({ data });
};

// Get a directory configuration
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { data, error } = await directorySyncController.directories.get(directoryId);

  if (error) {
    throw new ApiError(error.message, error.code);
  }

  res.json({ data });
};

// Delete a directory configuration
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { error } = await directorySyncController.directories.delete(directoryId);

  if (error) {
    throw new ApiError(error.message, error.code);
  }

  retraced.reportAdminPortalEvent({
    action: 'dsync.connection.delete',
    crud: 'd',
    req,
    target: {
      id: directoryId,
    },
  });

  res.json({ data: null });
};

export default handler;
