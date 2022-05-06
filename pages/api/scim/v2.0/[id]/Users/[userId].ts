import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { extractAuthToken } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { scimController } = await jackson();
  const { method } = req;
  const { id } = req.query;

  if (!(await scimController.validateAPISecret(id as string, extractAuthToken(req)))) {
    return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
  }

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'PUT':
      return handlePut(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { userId } = req.query;

  return res.status(200).json({
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    id: userId,
    userName: 'kiran@boxyhq.com',
    name: {
      givenName: 'Test',
      middleName: '',
      familyName: 'User',
    },
    active: true,
    emails: [
      {
        primary: true,
        value: 'kiran@boxyhq.com',
        type: 'work',
        display: 'kiran@boxyhq.com',
      },
    ],
    groups: [],
    meta: {
      resourceType: 'User',
    },
  });
};

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scimController } = await jackson();
  const body = JSON.parse(req.body);
  const { id } = req.query;

  scimController.sendEvent(<string>id, 'user.updated', body);

  return res.json(body);
};
