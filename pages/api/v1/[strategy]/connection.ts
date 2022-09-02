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
    const { strategy } = req.query;
    if (strategy !== 'saml' && strategy !== 'oidc') {
      throw { message: 'Strategy not supported', statusCode: 400 };
    }
    const { connectionAPIController } = await jackson();
    if (req.method === 'POST') {
      if (strategy === 'saml') {
        res.json(await connectionAPIController.createSAMLConnection(req.body));
      }
      if (strategy === 'oidc') {
        res.json(await connectionAPIController.createOIDCConnection(req.body));
      }
    } else if (req.method === 'GET') {
      res.json(await connectionAPIController.getConnection(req.query as any));
    } else if (req.method === 'PATCH') {
      if (strategy === 'saml') {
        res.status(204).end(await connectionAPIController.updateSAMLConnection(req.body));
      }
      if (strategy === 'oidc') {
        res.status(204).end(await connectionAPIController.updateOIDCConnection(req.body));
      }
    } else if (req.method === 'DELETE') {
      res.status(204).end(await connectionAPIController.deleteConnection(req.body));
    } else {
      throw { message: 'Method not allowed', statusCode: 405 };
    }
  } catch (err: any) {
    console.error('config api error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).send(message);
  }
}
