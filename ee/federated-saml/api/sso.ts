import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { setErrorCookie } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { method } = req;

    switch (method) {
      case 'GET':
        return await handleGET(req, res);
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (err: any) {
    console.error('authorize error:', err);
    const { message, statusCode = 500 } = err;
    // set error in cookie redirect to error page
    setErrorCookie(res, { message, statusCode }, { path: '/error' });
    res.redirect(302, '/error');
  }
}

// Handle the SAML Request from Service Provider
// This endpoint act as Single Sign On (SSO) URL
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederatedController } = await jackson();

  const { SAMLRequest, RelayState, idp_hint } = req.query as {
    SAMLRequest: string;
    RelayState: string;
    idp_hint: string;
  };

  const response = await samlFederatedController.sso.getAuthorizeUrl({
    request: SAMLRequest,
    relayState: RelayState,
    idp_hint,
  });

  if (!response) {
    throw new Error('Unable to create SAML Federated request. Error creating authorize url.');
  }

  if ('redirect_url' in response) {
    res.redirect(302, response.redirect_url);
  }

  if ('authorize_form' in response) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(response.authorize_form);
  }
};
