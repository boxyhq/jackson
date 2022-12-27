import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  const { setupLinkController } = await jackson();
  const token = req.query.token;
  const { data: setup, error: err } = await setupLinkController.getByToken(token);
  if (err || !setup) {
    res.status(err ? err.code : 401).json({ err });
  } else {
    switch (method) {
      case 'PUT':
        return handlePUT(req, res);
      default:
        res.setHeader('Allow', 'PUT');
        res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
    }
  }
};

// Update a directory configuration
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directoryId } = req.query;
  const { directorySyncController } = await jackson();

  const { name, webhook_url, webhook_secret, log_webhook_events } = req.body;

  const { data, error } = await directorySyncController.directories.update(directoryId as string, {
    name,
    log_webhook_events,
    webhook: {
      endpoint: webhook_url,
      secret: webhook_secret,
    },
  });

  return res.status(error ? error.code : 201).json({ data, error });
};

export default handler;
