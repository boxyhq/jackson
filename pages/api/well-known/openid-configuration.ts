import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    throw { message: 'Method not allowed', statusCode: 405 };
  }
  const { oidcDiscoveryController } = await jackson();
  const config = await oidcDiscoveryController.openidConfig();

  const response = JSON.stringify(config, null, 2);
  res.status(200).setHeader('Content-Type', 'application/json').send(response);
}
