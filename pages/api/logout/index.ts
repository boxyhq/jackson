import jackson from '@lib/jackson';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    throw new Error(`Method ${req.method} not allowed`);
  }

  const { nameId, tenant, product, redirectUrl } = req.query;

  try {
    const { logoutController } = await jackson();

    const { logoutUrl } = await logoutController.createRequest({
      nameId: <string>nameId,
      tenant: <string>tenant,
      product: <string>product,
      redirectUrl: <string>redirectUrl,
    });

    res.redirect(302, logoutUrl);
  } catch (err: any) {
    const { message, statusCode = 500 } = err;

    res.status(statusCode).send(message);
  }
}
