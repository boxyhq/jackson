import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { OIDCIdPInitiatedReq } from '@boxyhq/saml-jackson';
import { setErrorCookie } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      throw { message: 'Method not allowed', statusCode: 405 };
    }

    const { oauthController } = await jackson();
    const requestParams = req.method === 'GET' ? req.query : req.body;
    const { redirect_url } = await oauthController.oidcInitiateLogin(
      requestParams as unknown as OIDCIdPInitiatedReq
    );
    if (redirect_url) {
      res.redirect(302, redirect_url);
    }
  } catch (err: any) {
    console.error('OIDC IDP initiated login error:', err);
    const { message, statusCode = 500 } = err;
    // set error in cookie redirect to error page
    setErrorCookie(res, { message, statusCode }, { path: '/error' });
    res.redirect(302, '/error');
  }
}
