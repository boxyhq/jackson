import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { validateApiKey, extractAuthToken } from '@lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (!validateApiKey(extractAuthToken(req))) {
    return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
  }

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

  const { data: group, error } = await directorySyncController.groups.get(<string>groupId);

  // Get the members of the group if it exists
  if (group) {
    group['members'] = await directorySyncController.groups.getAllUsers(<string>groupId);
  }

  return res.status(error ? error.code : 200).json({ data: group, error });
};
