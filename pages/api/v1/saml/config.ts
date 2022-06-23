import jackson from '@lib/jackson';
import { NextApiRequest, NextApiResponse } from 'next';
import { validateApiKey, extractAuthToken } from '@lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!validateApiKey(extractAuthToken(req))) {
    return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
  }

  try {
    const { apiController } = await jackson();
    if (req.method === 'POST') {
      res.json(await apiController.config(req.body));
    } else if (req.method === 'GET') {
      res.json(await apiController.getConfig(req.query as any));
    } else if (req.method === 'PATCH') {
      res.status(204).end(await apiController.updateConfig(req.body));
    } else if (req.method === 'DELETE') {
      res.status(204).end(await apiController.deleteConfig(req.body));
    } else {
      throw new Error('Method not allowed');
    }
  } catch (err: any) {
    console.error('config api error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).send(message);
  }
}
