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

// Retrieve a user
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
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

// Update a user
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scimController, usersController } = await jackson();
  const { id, userId } = req.query;

  const body = JSON.parse(req.body);

  const event = body.active ? 'user.updated' : 'user.deleted';

  const { tenant, product } = await scimController.get(id as string);

  if (event === 'user.updated') {
    await usersController.with(tenant, product).update(userId as string, {
      first_name: body.name.givenName,
      last_name: body.name.familyName,
      email: body.emails[0].value,
      raw: body,
    });
  } else if (event === 'user.deleted') {
    await usersController.with(tenant, product).delete(userId as string);
  }

  scimController.sendEvent(<string>id, event, {
    ...body,
    id: userId,
  });

  return res.json(body);
};
