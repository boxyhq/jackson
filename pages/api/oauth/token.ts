import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { cors } from '@lib/middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { oauthController } = await jackson();
    const result = await oauthController.token(req.body);

    res.json(result);
  } catch (err: any) {
    console.error('token error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).send(message);
  }
}
