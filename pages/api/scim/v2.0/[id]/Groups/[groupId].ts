import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { extractAuthToken, printRequest, bodyParser } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { directorySync } = await jackson();
  const { method } = req;
  const { id } = req.query;

  printRequest(req);

  if (!(await directorySync.directory.validateAPISecret(id as string, extractAuthToken(req)))) {
    return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
  }

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    case 'PUT':
      return handlePUT(req, res);
    case 'PATCH':
      return handlePATCH(req, res);
    case 'DELETE':
      return handleDELETE(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Get a group
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scimController, groupsController } = await jackson();
  const { id, groupId } = req.query;

  const { tenant, product } = await scimController.get(id as string);

  const group = await groupsController.with(tenant, product).get(groupId as string);

  return res.status(200).json({
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
    id: group?.id,
    displayName: group?.name,
    members: group?.members,
  });
};

// Update a group
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scimController, groupsController } = await jackson();
  const { id, groupId } = req.query;

  const body = bodyParser(req);

  const { tenant, product } = await scimController.get(id as string);

  const group = await groupsController.with(tenant, product).update(groupId as string, {
    name: body.displayName,
    members: body.members,
    raw: body,
  });

  scimController.sendEvent(<string>id, 'group.updated', {
    ...group.raw,
  });

  return res.status(200).json(group.raw);
};

// Group membership updates
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scimController, groupsController, usersController } = await jackson();
  const { id, groupId } = req.query;

  const body = bodyParser(req);
  const operation = body.Operations[0];
  const userId = operation.value[0].value;

  const { tenant, product } = await scimController.get(id as string);

  const group = await groupsController.with(tenant, product).get(groupId as string);
  const user = await usersController.with(tenant, product).get(userId);

  if (operation.op === 'add' && operation.path === 'members') {
    await groupsController.with(tenant, product).addUser(groupId as string, userId);

    scimController.sendEvent(<string>id, 'group.user_added', {
      ...group,
      ...user,
    });
  }

  if (operation.op === 'remove' && operation.path === 'members') {
    await groupsController.with(tenant, product).removeUser(groupId as string, userId);

    scimController.sendEvent(<string>id, 'group.user_removed', {
      ...group,
      ...user,
    });
  }

  return res.status(204).end();
};

// Delete a group
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scimController, groupsController } = await jackson();
  const { id, groupId } = req.query;

  const { tenant, product } = await scimController.get(id as string);

  const group = await groupsController.with(tenant, product).get(groupId as string);

  await groupsController.with(tenant, product).delete(groupId as string);

  if (group != null) {
    scimController.sendEvent(<string>id, 'group.deleted', {
      ...group.raw,
    });
  }

  return res.status(204).end();
};

// Update group  (/Groups)
// '{"schemas":["urn:ietf:params:scim:api:messages:2.0:PatchOp"],"Operations":[{"op":"replace","value":{"id":"0a8c6814-f53a-4950-b775-1602771982e7","displayName":"Developers"}}]}'

// User has been removed (/Groups)
// {"Operations":[{"path":"members[value eq \\"34ef7e0a-16e4-4be2-bb81-c4e16e3f23be\\"]"}]}'

// User has been removed (/Users)
// '{"schemas":["urn:ietf:params:scim:api:messages:2.0:PatchOp"],"Operations":[{"op":"replace","value":{"active":false}}]}'
