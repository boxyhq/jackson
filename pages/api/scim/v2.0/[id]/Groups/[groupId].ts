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

  // TODO: Handle if the group doesn't exist

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

  const body = JSON.parse(req.body);

  const { tenant, product } = await scimController.get(id as string);

  const group = await groupsController.with(tenant, product).update(groupId as string, {
    name: body.displayName,
    members: body.members,
    raw: body,
  });

  scimController.sendEvent(<string>id, 'group.updated', {
    id: group.id,
    name: group.name,
    tenant,
    product,
  });

  return res.status(200).json(body);
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
      id: group.id,
      name: group.name,
      tenant,
      product,
    });
  }

  return res.status(204).json(null);
};
