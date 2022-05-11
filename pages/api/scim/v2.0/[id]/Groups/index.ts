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
    case 'POST':
      return handlePOST(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
    totalResults: 0,
    startIndex: 1,
    itemsPerPage: 0,
    Resources: [],
  });
};

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scimController, groupsController } = await jackson();
  const { id } = req.query;

  const body = JSON.parse(req.body);

  const { tenant, product } = await scimController.get(id as string);

  const group = await groupsController.with(tenant, product).create({
    name: body.displayName,
    members: body.members,
    raw: body,
  });

  scimController.sendEvent(<string>id, 'group.created', {
    id: group.id,
    name: group.name,
    tenant,
    product,
  });

  body.id = group.id;

  return res.status(200).json(body);
};
