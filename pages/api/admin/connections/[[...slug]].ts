import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';
import { strategyChecker } from '@lib/utils';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { connectionAPIController, adminController } = await jackson();

    if (req.method === 'GET') {
      const { slug, pageOffset, pageLimit } = req.query;
      if (slug?.[0]) {
        const connection = (await connectionAPIController.getConnections({ clientID: slug[0] }))[0];
        res.json(connection);
      } else {
        res.json(
          await adminController.getAllConnection(+(pageOffset || 0) as number, +(pageLimit || 0) as number)
        );
      }
    } else if (req.method === 'POST') {
      const { isSAML, isOIDC } = strategyChecker(req);
      if (isSAML) {
        res.json(await connectionAPIController.createSAMLConnection(req.body));
      }
      if (isOIDC) {
        res.json(await connectionAPIController.createOIDCConnection(req.body));
      }
    } else if (req.method === 'PATCH') {
      const { isSAML, isOIDC } = strategyChecker(req);
      if (isSAML) {
        res.status(204).end(await connectionAPIController.updateSAMLConnection(req.body));
      }
      if (isOIDC) {
        res.status(204).end(await connectionAPIController.updateOIDCConnection(req.body));
      }
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
};

export default checkSession(handler);
