import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { extractAuthToken, validateApiKey } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiKey = extractAuthToken(req);
    if (!validateApiKey(apiKey)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { adminController } = await jackson();
    if (req.method === 'GET') {
      res.json(await adminController.getAllConfig());
    } else {
      throw new Error('Method not allowed');
    }
  } catch (err: any) {
    console.error('config api error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).send(message);
  }
}
