import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';

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

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId, eventId } = req.query as { directoryId: string; eventId: string };

  const { data: directory, error } = await directorySyncController.directories.get(directoryId);

  if (error) {
    return res.status(400).json({ error });
  }

  if (!directory) {
    return res.status(404).json({ error: { message: 'Directory not found.' } });
  }

  const event = await directorySyncController.webhookLogs
    .with(directory.tenant, directory.product)
    .get(eventId);

  return res.status(200).json({ data: event });
};

export default checkSession(handler);
