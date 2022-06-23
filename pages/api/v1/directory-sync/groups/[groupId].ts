import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Get a group by id
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySyncController } = await jackson();

  const { tenant, product, groupId } = req.query;

  directorySyncController.groups.setTenantAndProduct(<string>tenant, <string>product);

  try {
    const data = {
      ...(await directorySyncController.groups.get(<string>groupId)),
      members: await directorySyncController.groups.getAllUsers(<string>groupId),
    };

    return res.status(200).json({ data, error: null });
  } catch (err: any) {
    const { message, statusCode = 500 } = err;

    return res.status(statusCode).json({ data: null, error: { message } });
  }
};
