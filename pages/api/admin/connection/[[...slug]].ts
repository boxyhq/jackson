import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { configAPIController, adminController } = await jackson();

    if (req.method === 'GET') {
      const { slug, pageOffset, pageLimit } = req.query;
      if (slug?.[0]) {
        res.json(await configAPIController.getConfig({ clientID: slug[0] }));
      } else {
        res.json(
          await adminController.getAllConfig(+(pageOffset || 0) as number, +(pageLimit || 0) as number)
        );
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
