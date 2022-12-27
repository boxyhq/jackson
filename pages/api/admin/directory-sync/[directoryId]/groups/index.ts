import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await handleGET(req, res);
    default:
      res.setHeader('Allow', 'GET');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
};

// Get all groups for a directory
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId, offset } = req.query as { directoryId: string; offset: string };

  const { data: directory } = await directorySyncController.directories.get(directoryId);

  if (!directory) {
    return res.status(404).json({ error: { message: 'Directory not found.' } });
  }

  const pageOffset = parseInt(offset);
  const pageLimit = 25;

  const { data: groups, error } = await directorySyncController.groups
    .with(directory.tenant, directory.product)
    .list({ pageOffset, pageLimit });

  if (error) {
    return res.status(400).json({ error });
  }

  if (groups) {
    return res.status(200).json({ data: groups });
  }
};

export default checkSession(handler);
