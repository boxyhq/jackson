import { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { connectionAPIController } = await jackson();
    const { strategy } = req.query;
    if (strategy !== 'saml' && strategy !== 'oidc') {
      throw { message: 'Strategy not supported', statusCode: 400 };
    }

    if (req.method === 'POST') {
      if (strategy === 'saml') {
        res.json(await connectionAPIController.createSAMLConnection(req.body));
      }
      if (strategy === 'oidc') {
        res.json(await connectionAPIController.createOIDCConnection(req.body));
      }
    } else if (req.method === 'PATCH') {
      if (strategy === 'saml') {
        res.status(204).end(await connectionAPIController.updateSAMLConnection(req.body));
      }
      if (strategy === 'oidc') {
        res.status(204).end(await connectionAPIController.updateOIDCConnection(req.body));
      }
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
