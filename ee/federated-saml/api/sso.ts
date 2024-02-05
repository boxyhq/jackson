import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { setErrorCookie } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { method } = req;

    switch (method) {
      case 'GET':
        return await handleSAMLRequest(req, res);
      case 'POST':
        return await handleSAMLRequest(req, res, true);
      default:
        res.setHeader('Allow', 'GET, POST');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (err: any) {
    console.error('authorize error:', err);

    const { message, statusCode = 500 } = err;
    setErrorCookie(res, { message, statusCode }, { path: '/error' });
    res.redirect(302, '/error');
  }
}

type SAMLRequest = {
  SAMLRequest: string;
  RelayState: string;
};

// Handle the SAML Request from Service Provider
// This endpoint act as Single Sign On (SSO) URL
async function handleSAMLRequest(req: NextApiRequest, res: NextApiResponse, isPostBinding = false) {
  let samlRequest = '';
  let relayState = '';
  let idpHint = '';
  let isDeflated = true;
  let binding: 'http-redirect' | 'http-post' = 'http-redirect';

  if (isPostBinding) {
    const { SAMLRequest, RelayState } = req.body as SAMLRequest;

    samlRequest = SAMLRequest;
    relayState = RelayState;

    binding = 'http-post';
    isDeflated = false;
  } else {
    const { SAMLRequest, RelayState } = req.query as SAMLRequest;

    samlRequest = SAMLRequest;
    relayState = RelayState;
    binding = 'http-post';
  }

  if ('idp_hint' in req.query) {
    idpHint = req.query.idp_hint as string;
  }

  const { samlFederatedController } = await jackson();

  const response = await samlFederatedController.sso.getAuthorizeUrl({
    request: samlRequest,
    relayState,
    idpHint,
    binding,
  });

  if (!response) {
    throw new Error('Unable to create SAML Federated request. Error creating authorize url.');
  }

  if ('redirect_url' in response && response.redirect_url) {
    res.redirect(302, response.redirect_url);
  }

  if ('authorize_form' in response && response.authorize_form) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(response.authorize_form);
  }
}
