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
      return handleGet(req, res);
    case 'PUT':
      return handlePut(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scimController, usersController } = await jackson();
  const { id, userId } = req.query;

  const { tenant, product } = await scimController.get(id as string);

  const user = await usersController.with(tenant, product).get(userId as string);

  if (user === null) {
    return res.status(404).json({
      schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
      detail: 'User not found',
      status: 404,
    });
  }

  return res.json(user.raw);
};

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scimController, usersController } = await jackson();
  const { id, userId } = req.query;

  const body = JSON.parse(req.body);

  const { tenant, product } = await scimController.get(id as string);

  await usersController.with(tenant, product).update(userId as string, {
    id: body.id,
    first_name: body.name.givenName,
    last_name: body.name.familyName,
    email: body.emails[0].value,
    raw: body,
  });

  scimController.sendEvent(<string>id, 'user.updated', {
    ...body,
    tenant,
    product,
  });

  return res.json(body);
};
