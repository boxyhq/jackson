import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { setErrorCookie } from '@lib/utils';
import { OIDCAuthzResponsePayload } from '@npm/src/index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      throw { message: 'Method not allowed', statusCode: 405 };
    }

    const { oauthController } = await jackson();

    const { redirect_url } = await oauthController.oidcAuthzResponse(
      req.query as unknown as OIDCAuthzResponsePayload
    );
    if (redirect_url) {
      res.redirect(302, redirect_url);
    }
  } catch (err: any) {
    console.error('callback error:', err);
    const { message, statusCode = 500 } = err;
    // set error in cookie redirect to error page
    setErrorCookie(res, { message, statusCode }, { path: '/error' });
    res.redirect(302, '/error');
  }
}
