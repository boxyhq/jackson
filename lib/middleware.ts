import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { sessionName } from './constants';

// Initializing the cors middleware
const corsFunction = Cors({
  methods: ['GET', 'HEAD'],
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

export async function cors(req: NextApiRequest, res: NextApiResponse) {
  return await runMiddleware(req, res, corsFunction);
}

export const checkSession = (handler) => async (req: NextApiRequest, res: NextApiResponse) => {
  const token = await getToken({
    req,
    cookieName: sessionName,
  });

  if (token) {
    // Signed in
    return handler(req, res);
  } else {
    // Not Signed in
    res.status(401);
  }
  res.end();
};
