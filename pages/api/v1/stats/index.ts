import jackson from '@lib/jackson';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
}

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { connectionAPIController, directorySyncController } = await jackson();

  const sso_connections_count = await connectionAPIController.getCount();
  const dsync_connections_count = await directorySyncController.directories.getCount();

  return res.json({
    data: {
      sso_connections: sso_connections_count,
      dsync_connections: dsync_connections_count,
    },
  });
};
