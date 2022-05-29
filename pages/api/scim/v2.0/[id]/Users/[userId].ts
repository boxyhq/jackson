import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { extractAuthToken, bodyParser } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { directorySync } = await jackson();
  const { method } = req;
  const { id } = req.query;

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

// Retrieve a user
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySync } = await jackson();
  const { id, userId } = req.query;

  const result = await directorySync.users.get({
    directory: id as string,
    data: {
      user_id: userId as string,
    },
  });

  return res.json(result);
};

// Update a specific user
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySync } = await jackson();
  const { id, userId } = req.query;

  const result = await directorySync.users.update({
    directory: id as string,
    data: {
      user_id: userId as string,
      body: bodyParser(req),
    },
  });

  return res.json(result);
};

// Update a specific user
const handlePATCH = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySync } = await jackson();
  const { id, userId } = req.query;

  const result = await directorySync.users.update({
    directory: id as string,
    data: {
      user_id: userId as string,
      body: bodyParser(req),
    },
  });

  return res.json(result);
};

// Delete a user
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directorySync } = await jackson();
  const { id, userId } = req.query;

  const result = await directorySync.users.delete({
    directory: id as string,
    data: {
      user_id: userId as string,
    },
  });

  return res.json(result);
};
