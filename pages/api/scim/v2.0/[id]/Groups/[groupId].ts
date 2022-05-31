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
    // case 'PATCH':
    //   return handlePATCH(req, res);
    case 'DELETE':
      return handleDELETE(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Get a group
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySync } = await jackson();
  const { id, groupId } = req.query;

  const result = await directorySync.groups.get({
    directory: id as string,
    data: {
      group_id: groupId as string,
    },
  });

  return res.json(result);
};

// Update a group
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySync } = await jackson();
  const { id, groupId } = req.query;

  const result = await directorySync.groups.update({
    directory: id as string,
    data: {
      group_id: groupId as string,
      body: bodyParser(req),
    },
  });

  return res.json(result);
};

// Group membership updates
// const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
//   const { scimController, groupsController, usersController } = await jackson();
//   const { id, groupId } = req.query;

//   const body = bodyParser(req);
//   const operation = body.Operations[0];
//   const userId = operation.value[0].value;

//   const { tenant, product } = await scimController.get(id as string);

//   const group = await groupsController.with(tenant, product).get(groupId as string);
//   const user = await usersController.with(tenant, product).get(userId);

//   if (operation.op === 'add' && operation.path === 'members') {
//     await groupsController.with(tenant, product).addUser(groupId as string, userId);

//     scimController.sendEvent(<string>id, 'group.user_added', {
//       ...group,
//       ...user,
//     });
//   }

//   if (operation.op === 'remove' && operation.path === 'members') {
//     await groupsController.with(tenant, product).removeUser(groupId as string, userId);

//     scimController.sendEvent(<string>id, 'group.user_removed', {
//       ...group,
//       ...user,
//     });
//   }

//   return res.status(204).end();
// };

// Delete a group
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySync } = await jackson();
  const { id, groupId } = req.query;

  await directorySync.groups.delete({
    directory: id as string,
    data: {
      group_id: groupId as string,
    },
  });

  return res.status(204).end();
};
