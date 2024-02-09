import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { setErrorCookie } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      throw { message: 'Method not allowed', statusCode: 405 };
    }

    const { oauthController } = await jackson();

    const { redirect_url, response_form } = await oauthController.oidcAuthzResponse(req.query);

    if (redirect_url) {
      res.redirect(302, redirect_url);
    }

    if (response_form) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(response_form);
    }
  } catch (err: any) {
    console.error('callback error:', err);
    const { message, statusCode = 500 } = err;
    // set error in cookie redirect to error page
    setErrorCookie(res, { message, statusCode }, { path: '/error' });
    res.redirect(302, '/error');
  }
}
