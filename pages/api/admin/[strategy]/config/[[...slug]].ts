import { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { adminController, configAPIController } = await jackson();
    const { strategy } = req.query;
    if (strategy !== 'saml' && strategy !== 'oidc') {
      throw { message: 'Strategy not supported', statusCode: 400 };
    }
    if (req.method === 'GET') {
      const { slug, pageOffset, pageLimit } = req.query;
      if (slug?.[0]) {
        res.json(await configAPIController.getConfig({ clientID: slug[0] }));
      } else {
        res.json(
          await adminController.getAllConfig(+(pageOffset || 0) as number, +(pageLimit || 0) as number)
        );
      }
    } else if (req.method === 'POST') {
      if (strategy === 'saml') {
        res.json(await configAPIController.createSAMLConfig(req.body));
      }
      if (strategy === 'oidc') {
        res.json(await configAPIController.createOIDCConfig(req.body));
      }
    } else if (req.method === 'PATCH') {
      if (strategy === 'saml') {
        res.status(204).end(await configAPIController.updateSAMLConfig(req.body));
      }
      if (strategy === 'oidc') {
        res.status(204).end(await configAPIController.updateOIDCConfig(req.body));
      }
    } else if (req.method === 'DELETE') {
      res.status(204).end(await configAPIController.deleteConfig(req.body));
    } else {
      throw { message: 'Method not allowed', statusCode: 405 };
    }
  } catch (err: any) {
    console.error('config api error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).send(message);
  }
};

export default checkSession(handler);
