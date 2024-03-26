import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { cors } from '@lib/middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'POST') {
      throw { message: 'Method not allowed', statusCode: 405 };
    }

    const { oauthController } = await jackson();
    const authHeader = req.headers['authorization'];
    const result = await oauthController.token(req.body, authHeader);

    res.json(result);
  } catch (err: any) {
    console.error('token error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).send(message);
  }
}
