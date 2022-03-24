import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      throw new Error('Method not allowed');
    }
    const { healthCheckController } = await jackson();
    const g = global as any;
    const healthStatus = await healthCheckController.healthCheck();
    const completeHealthStatus = await healthCheckController.completeHealthCheck(g.isJacksonReady);
    /*
    if (!healthStatus) {
      res.status(503).json({ status: 'Down' });
    } else {
      res.status(200).json({ status: 'Up' });
    }
*/
    console.log(completeHealthStatus);
    res.status(completeHealthStatus.status).json({
      status: completeHealthStatus.status,
      healthy: completeHealthStatus.healthy,
      ready: completeHealthStatus.ready,
    });
  } catch (err: any) {
    const { message, statusCode = 500 } = err;
    res.status(statusCode).send(message);
  }
}
