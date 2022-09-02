import jackson from '@lib/jackson';
import { extractAuthToken, validateApiKey } from '@lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiKey = extractAuthToken(req);
    if (!validateApiKey(apiKey)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { connectionAPIController } = await jackson();
    if (req.method === 'GET') {
      const rsp = await connectionAPIController.getConnection(req.query as any);
      if (Object.keys(rsp).length === 0) {
        res.status(404).send({});
      } else {
        res.status(204).end();
      }
    } else {
      throw { message: 'Method not allowed', statusCode: 405 };
    }
  } catch (err: any) {
    console.error('config api error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).send(message);
  }
}
