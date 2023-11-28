import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import retraced from '@ee/retraced';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await handleGET(req, res);
    default:
      res.setHeader('Allow', 'GET');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
};

// Get all users in a directory
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId, offset, limit } = req.query as { directoryId: string; offset: string; limit: string };

  const { data: directory } = await directorySyncController.directories.get(directoryId);

  if (!directory) {
    return res.status(404).json({ error: { message: 'Directory not found.' } });
  }

  const pageOffset = parseInt(offset);
  const pageLimit = parseInt(limit);

  const { data: users, error } = await directorySyncController.users
    .setTenantAndProduct(directory.tenant, directory.product)
    .getAll({ pageOffset, pageLimit, directoryId });

  if (error) {
    return res.status(error.code).json({ error });
  }

  if (users) {
    retraced.reportAdminPortalEvent({
      action: 'dsync.user.list',
      crud: 'r',
      req,
      target: {
        id: directoryId,
      },
    });

    return res.status(200).json({ data: users });
  }
};

export default handler;
