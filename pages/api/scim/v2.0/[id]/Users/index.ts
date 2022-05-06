import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { printRequest } from '@lib/utils';
import { extractAuthToken } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { scimController } = await jackson();
  const { method } = req;
  const { id } = req.query;

  if (!(await scimController.validateAPISecret(id as string, extractAuthToken(req)))) {
    return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
  }

  printRequest(req);

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
    totalResults: 0,
    startIndex: 1,
    itemsPerPage: 0,
    Resources: [],
  });
};

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scimController } = await jackson();
  const user = JSON.parse(req.body);
  const { id } = req.query;

  user['id'] = user.externalId;

  scimController.sendEvent(<string>id, 'user.created', user);

  return res.json(user);
};
