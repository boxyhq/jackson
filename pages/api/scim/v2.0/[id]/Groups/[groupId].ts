import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { extractAuthToken, printRequest } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { scimController } = await jackson();
  const { method } = req;
  const { id } = req.query;

  printRequest(req);

  if (!(await scimController.validateAPISecret(id as string, extractAuthToken(req)))) {
    return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
  }

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    case 'PUT':
      return handlePUT(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scimController, usersController } = await jackson();
  const { id, groupId } = req.query;

  return res.status(200).json({
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
    id: 'abf4dd94-a4c0-4f67-89c9-76b03340cb9b',
    displayName: 'test',
    members: [],
  });
};

const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
    id: 'abf4dd94-a4c0-4f67-89c9-76b03340cb9b',
    displayName: 'test',
    members: [],
  });
};
