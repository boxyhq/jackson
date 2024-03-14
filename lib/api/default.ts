import { ApiError } from '../error';
import type { NextApiRequest, NextApiResponse } from 'next';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type Handlers = {
  [method in HTTPMethod]?: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
};

export const defaultHandler = async (req: NextApiRequest, res: NextApiResponse, handlers: Handlers) => {
  try {
    // Get the handler for the request
    const handler = handlers[req.method as HTTPMethod];
    const allowedMethods = Object.keys(handlers).join(', ');

    if (!handler) {
      res.setHeader('Allow', allowedMethods);
      throw new ApiError(`Method ${req.method} not allowed.`, 405);
    }

    // Call the handler
    await handler(req, res);
    return;
  } catch (error: any) {
    const message = error.message || 'Internal Server Error';
    const status = error.statusCode || 500;

    console.error(`${req.method} ${req.url} - ${status} - ${message}`);

    res.status(status).json({ error: { message } });
  }
};
