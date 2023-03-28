import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'PATCH':
      return await handlePATCH(req, res);
    case 'GET':
      return await handleGET(req, res);
    default:
      res.setHeader('Allow', 'GET, PATCH');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
};

// Update a directory configuration
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { data, error } = await directorySyncController.directories.update(directoryId, req.body);

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

export default handler;
