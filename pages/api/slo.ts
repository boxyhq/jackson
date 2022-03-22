import jackson from '@lib/jackson';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const { nameId, tenant, product } = req.query;

  try {
    const { logoutController } = await jackson();

    const { logoutUrl } = await logoutController.createRequest({
      nameId: nameId as string,
      tenant: tenant as string,
      product: product as string,
    });

    res.redirect(302, logoutUrl);
  } catch (err: any) {
    const { message, statusCode = 500 } = err;

    res.status(statusCode).send(message);
  }
}
