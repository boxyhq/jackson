import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { extractAuthToken, validateApiKey } from '@lib/utils';
import { checkSession } from '@lib/middleware';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const apiKey = extractAuthToken(req);
    if (!validateApiKey(apiKey)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { adminController, apiController } = await jackson();
    if (req.method === 'GET') {
      res.json(await adminController.getAllConfig());
    } else if (req.method === 'POST') {
      res.json(await apiController.config(req.body));
    } else if (req.method === 'PATCH') {
      res.json(await apiController.updateConfig(req.body));
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
