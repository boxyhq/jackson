import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'DELETE':
      return handleDELETE(req, res);
    default:
      res.setHeader('Allow', ['DELETE']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
};

// Delete all events
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { data: directory, error } = await directorySyncController.directories.get(directoryId);

  if (!directory) {
    return res.status(404).json({ error });
  }

  await directorySyncController.webhookLogs.setTenantAndProduct(directory.tenant, directory.product).clear();

  return res.status(200).json({ data: null });
};

export default checkSession(handler);
