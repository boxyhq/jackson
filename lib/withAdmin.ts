import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from './error';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type Handlers = {
  [method in HTTPMethod]?: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
};

export const withAdmin = async (req: NextApiRequest, res: NextApiResponse, handlers: Handlers) => {
  try {
    // Get the handler for the request
    const handler = handlers[req.method as HTTPMethod];
    const allowedMethods = Object.keys(handlers).join(', ');

    if (!handler) {
      res.setHeader('Allow', allowedMethods);
      throw new ApiError(405, `Method ${req.method} not allowed.`);
    }

    // Call the handler
    await handler(req, res);
  } catch (error: any) {
    const message = error.message || 'An server error occurred.';
    const status = error.status || 500;

    console.error(`${req.method} ${req.url} - ${status} - ${message}`);

    res.status(status).json({ error: { message } });
  }
};
