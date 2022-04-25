import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { OAuthReqBody } from '@boxyhq/saml-jackson';
import { setErrorCookie } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      throw new Error('Method not allowed');
    }

    const { oauthController } = await jackson();
    const { redirect_url, authorize_form } = await oauthController.authorize(
      req.query as unknown as OAuthReqBody
    );
    if (redirect_url) {
      res.redirect(302, redirect_url);
    } else {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(authorize_form);
    }
  } catch (err: any) {
    console.error('authorize error:', err);
    const { message, statusCode = 500 } = err;
    // set error in cookie redirect to error page
    setErrorCookie(res, { message, statusCode }, { path: '/error' });
    res.redirect('/error');
  }
}
