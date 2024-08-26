import { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { OIDCIdPInitiatedReq } from '@boxyhq/saml-jackson';
import { setErrorCookie } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      throw { message: 'Method not allowed', statusCode: 405 };
    }

    const { identityFederationController } = await jackson();
    let requestParams;
    const { fedAppId } = req.query;

    if (req.method === 'GET') {
      requestParams = req.query;
    } else if (req.method === 'POST') {
      requestParams = req.body;
    }

    const { redirect_url } = await identityFederationController.idpLogin.oidcInitiateLogin(
      requestParams as unknown as OIDCIdPInitiatedReq,
      fedAppId as string
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
