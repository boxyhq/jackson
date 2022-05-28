import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { extractAuthToken, printRequest, bodyParser } from '@lib/utils';

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
    // case 'PATCH':
    //   return handlePATCH(req, res);
    case 'DELETE':
      return handleDELETE(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Retrieve a user
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scim } = await jackson();
  const { id, userId } = req.query;

  const result = await scim.users.get({
    directory: id as string,
    data: {
      user_id: userId as string,
    },
  });

  return res.json(result);
};

// Update a specific User
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { scim } = await jackson();
  const { id, userId } = req.query;

  const result = await scim.users.update({
    directory: id as string,
    data: {
      user_id: userId as string,
      body: bodyParser(req),
    },
  });

  return res.json(result);
};

// Update a specific User (PATCH) Not Done
// const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
//   const { scimController, usersController } = await jackson();
//   const { id, userId } = req.query;

//   const { tenant, product } = await scimController.get(id as string);

//   const user = await usersController.with(tenant, product).get(userId as string);

//   if (user === null) {
//     return res.status(404).json({
//       schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
//       detail: 'User not found',
//       status: 404,
//     });
//   }

//   await usersController.with(tenant, product).delete(userId as string);

//   scimController.sendEvent(<string>id, 'user.deleted', {
//     ...user.raw,
//   });

//   return res.status(204).json(null);
// };

// {"schemas":["urn:ietf:params:scim:api:messages:2.0:PatchOp"],"Operations":[{"op":"replace","value":{"active":false}}]}

// Delete a user
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
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

  await usersController.with(tenant, product).delete(userId as string);

  scimController.sendEvent(<string>id, 'user.deleted', {
    ...user.raw,
  });

  return res.status(204).json(null);
};
