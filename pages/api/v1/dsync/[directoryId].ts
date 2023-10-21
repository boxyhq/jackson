import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await handleGET(req, res);
    case 'DELETE':
      return await handleDELETE(req, res);
    case 'PATCH':
      return await handlePATCH(req, res);
    default:
      res.setHeader('Allow', 'GET, DELETE, PATCH');
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
  }
}

// Get directory by id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { data, error } = await directorySyncController.directories.get(directoryId);

  if (error) {
    return res.status(error.code).json({ error });
  }

  return res.status(200).json({ data });
};

// Delete directory by id
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  await directorySyncController.directories.delete(directoryId);

  return res.status(200).json({ data: {} });
};

// Update directory
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { directoryId } = req.query as { directoryId: string };

  const { data, error } = await directorySyncController.directories.update(directoryId, req.body);

  if (error) {
    res.status(error.code).json({ error });
  }

  res.json({ data });
};
