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
    const { redirect_url, authorize_form, redirect_to_idp_select } = await oauthController.authorize(
      req.query as unknown as OAuthReqBody
    );
    if (redirect_to_idp_select && req.url) {
      const proto = req.headers['x-forwarded-proto'] || req.connection.encrypted ? 'https' : 'http';

      const originalURL = new URL(req.url, `${proto}://${req.headers.host}`);

      res.redirect(
        302,
        redirect_to_idp_select + `&returnTo=${encodeURIComponent(originalURL.origin + originalURL.pathname)}`
      );
    } else if (redirect_url) {
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
