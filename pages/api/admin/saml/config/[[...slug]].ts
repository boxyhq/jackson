import { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { checkSession } from '@lib/middleware';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { adminController, apiController } = await jackson();
    if (req.method === 'GET') {
      const { slug, offset, limit } = req.query;
      if (slug?.[0]) {
        res.json(await apiController.getConfig({ clientID: slug[0] }));
      } else {
        res.json(await adminController.getAllConfig(offset, limit));
      }
    } else if (req.method === 'POST') {
      res.json(await apiController.config(req.body));
    } else if (req.method === 'PATCH') {
      res.status(204).send(await apiController.updateConfig(req.body));
    } else if (req.method === 'DELETE') {
      res.json(await apiController.deleteConfig(req.body));
    } else {
      throw new Error('Method not allowed');
    }
  } catch (err: any) {
    console.error('config api error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).send(message);
  }
};

export default checkSession(handler);
