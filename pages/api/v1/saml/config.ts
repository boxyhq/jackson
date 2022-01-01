import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { apiController } = await jackson();
    if (req.method === 'POST') {
      res.json(await apiController.config(req.body));
    } else if (req.method === 'GET') {
      res.json(await apiController.getConfig(req.query as any));
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
