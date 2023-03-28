import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'PUT':
      return await handlePUT(req, res);
    case 'GET':
      return await handleGET(req, res);
    case 'DELETE':
      return await handleDELETE(req, res);
    default:
      res.setHeader('Allow', 'GET, PUT, DELETE');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
};

// Update a directory configuration
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };
  const { name, webhook_url, webhook_secret, log_webhook_events } = req.body;

  const { data, error } = await directorySyncController.directories.update(directoryId, {
    name,
    log_webhook_events,
    webhook: {
      endpoint: webhook_url,
      secret: webhook_secret,
    },
  });

  if (data) {
    return res.status(200).json({ data });
  }

  if (error) {
    return res.status(error.code).json({ error });
  }
};

// Get a directory configuration
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { data, error } = await directorySyncController.directories.get(directoryId);

  if (data) {
    return res.status(200).json({ data });
  }

  if (error) {
    return res.status(error.code).json({ error });
  }
};

// Delete a directory configuration
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { error } = await directorySyncController.directories.delete(directoryId);

  if (error) {
    return res.status(error.code).json({ error });
  }

  return res.json({ data: null });
};

export default handler;
