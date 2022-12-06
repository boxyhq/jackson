import jackson, { type GetConnectionsQuery } from '@lib/jackson';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { connectionAPIController } = await jackson();
    if (req.method === 'GET') {
      const rsp = await connectionAPIController.getConnections(req.query as GetConnectionsQuery);
      if (rsp.length === 0) {
        res.status(404).send({});
      } else {
        res.status(204).end();
      }
    } else {
      throw { message: 'Method not allowed', statusCode: 405 };
    }
  } catch (err: any) {
    console.error('connection api error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).json({ error: { message } });
  }
}
