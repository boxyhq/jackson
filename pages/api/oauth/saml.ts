import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { JACKSON_ERROR_COOKIE_KEY, setCookie } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { oauthController } = await jackson();
    const { redirect_url } = await oauthController.samlResponse(req.body);

    res.redirect(302, redirect_url);
  } catch (err: any) {
    console.error('callback error:', err);
    const { message, statusCode = 500 } = err;
    // set error in cookie redirect to error page
    setCookie(res, JACKSON_ERROR_COOKIE_KEY, { message, statusCode }, { path: '/error' });
    res.redirect('/error');
  }
}
