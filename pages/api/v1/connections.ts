import jackson, { type GetConnectionsQuery } from '@lib/jackson';
import { strategyChecker } from '@lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { connectionAPIController } = await jackson();

    if (req.method === 'GET') {
      res.json(await connectionAPIController.getConnections(req.query as GetConnectionsQuery));
    } else if (req.method === 'POST') {
      const { isSAML, isOIDC } = strategyChecker(req);
      if (isSAML) {
        res.json(await connectionAPIController.createSAMLConnection(req.body));
      } else if (isOIDC) {
        res.json(await connectionAPIController.createOIDCConnection(req.body));
      } else {
        throw { message: 'Missing SSO connection params', statusCode: 400 };
      }
    } else if (req.method === 'PATCH') {
      const { isSAML, isOIDC } = strategyChecker(req);

      if (isSAML) {
        res.status(204).end(await connectionAPIController.updateSAMLConnection(req.body));
      } else if (isOIDC) {
        res.status(204).end(await connectionAPIController.updateOIDCConnection(req.body));
      } else {
        throw { message: 'Missing SSO connection params', statusCode: 400 };
      }
    } else if (req.method === 'DELETE') {
      res.status(204).end(await connectionAPIController.deleteConnections(req.body));
    } else {
      throw { message: 'Method not allowed', statusCode: 405 };
    }
  } catch (err: any) {
    console.error('connection api error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).json({ error: { message } });
  }
}
