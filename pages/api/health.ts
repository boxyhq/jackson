import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import packageInfo from '../../package.json';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      throw new Error('Method not allowed');
    }

    const { healthCheckController } = await jackson();

    const { status } = await healthCheckController.status();
    res.status(status).json({
      version: packageInfo.version,
    });
  } catch (err: any) {
    console.error('HealthCheck failed', err);
    const { statusCode = 503 } = err;
    res.status(statusCode).json({});
  }
}
