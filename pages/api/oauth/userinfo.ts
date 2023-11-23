import { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { extractAuthToken } from '@lib/auth';
import retraced from '@ee/retraced';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      throw { message: 'Method not allowed', statusCode: 405 };
    }

    const { oauthController, productController } = await jackson();
    let token: string | null = extractAuthToken(req);

    // check for query param
    if (!token) {
      let arr: string[] = [];
      arr = arr.concat(req.query.access_token || '');
      if (arr[0].length > 0) {
        token = arr[0];
      }
    }

    if (!token) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const profile = await oauthController.userInfo(token);

    retraced.reportEvent({
      action: 'sso.user.login',
      crud: 'r',
      actor: {
        id: profile.email,
        name: `${profile.firstName} ${profile.lastName}`,
      },
      productId: profile.requested.product,
    });

    res.json(profile);
  } catch (err: any) {
    console.error('userinfo error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).json({ message });
  }
}
