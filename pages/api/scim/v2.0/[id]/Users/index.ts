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
  const { scimController, usersController } = await jackson();
  const { id } = req.query;

  const body = JSON.parse(req.body);

  body.id = body.externalId;

  const { tenant, product } = await scimController.get(id as string);

  await usersController.with(tenant, product).create({
    id: body.externalId,
    first_name: body.name.givenName,
    last_name: body.name.familyName,
    email: body.emails[0].value,
    raw: body,
  });

  scimController.sendEvent(id as string, 'user.created', {
    ...body,
    tenant,
    product,
  });

  return res.json(body);
};
