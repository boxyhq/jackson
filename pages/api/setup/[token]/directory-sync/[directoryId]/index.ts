import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController } = await jackson();

  const { method } = req;
  const { token } = req.query as { token: string };

  try {
    await setupLinkController.getByToken(token);

    switch (method) {
      case 'PUT':
        return await handlePUT(req, res);
      case 'GET':
        return await handleGET(req, res);
      default:
        res.setHeader('Allow', 'PUT, GET');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

// Update a directory configuration
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { name, webhook_url, webhook_secret, log_webhook_events } = req.body;

  const { data, error } = await directorySyncController.directories.update(directoryId as string, {
    name,
    log_webhook_events,
    webhook: {
      endpoint: webhook_url,
      secret: webhook_secret,
    },
  });

  if (data) {
    return res.status(201).json({ data });
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
    return res.json({ data });
  }

  if (error) {
    return res.status(error.code).json({ error });
  }
};

export default handler;
