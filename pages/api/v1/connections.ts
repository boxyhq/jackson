import jackson, { type GetConnectionsQuery } from '@lib/jackson';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { connectionAPIController } = await jackson();
    if (req.method === 'GET') {
      res.json(await connectionAPIController.getConnections(req.query as GetConnectionsQuery));
    } else if (req.method === 'DELETE') {
      res.status(204).end(await connectionAPIController.deleteConnections(req.body));
    } else {
      throw { message: 'Method not allowed', statusCode: 405 };
    }
  } catch (err: any) {
    console.error('connection api error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).send(message);
  }
}
