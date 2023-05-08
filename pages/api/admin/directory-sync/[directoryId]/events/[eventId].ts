import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { sendAudit } from '@ee/audit-log/lib/retraced';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGET(req, res);
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;
    return res.status(statusCode).json({ error: { message } });
  }
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId, eventId } = req.query as { directoryId: string; eventId: string };

  const { data: directory, error } = await directorySyncController.directories.get(directoryId);

  if (error) {
    return res.status(error.code).json({ error });
  }

  if (!directory) {
    return res.status(404).json({ error: { message: 'Directory not found.' } });
  }

  const event = await directorySyncController.webhookLogs
    .with(directory.tenant, directory.product)
    .get(eventId);

  sendAudit({
    action: 'dsync.event.view',
    crud: 'r',
    req,
  });

  return res.status(200).json({ data: event });
};

export default handler;
