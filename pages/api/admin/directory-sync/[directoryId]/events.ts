import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'DELETE':
      return handleDELETE(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
};

// Delete all events
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { directoryId } = req.query;
  const { directorySyncController } = await jackson();

  const { tenant, product } = await directorySyncController.directories.get(directoryId as string);

  try {
    await directorySyncController.events.setTenantAndProduct(tenant, product).clear();

    return res.status(201).json({ data: null, error: null });
  } catch (err: any) {
    const { message, statusCode = 500 } = err;

    return res.status(statusCode).json({ data: null, error: { message } });
  }
};

export default checkSession(handler);
