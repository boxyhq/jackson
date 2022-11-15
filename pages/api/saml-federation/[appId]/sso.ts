import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Handle the SAML Request from Service Provider
// This endpoint act as Single Sign On (SSO) URL for Service Provider
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederation } = await jackson();

  const { appId, SAMLRequest, RelayState } = req.query as {
    appId: string;
    SAMLRequest: string;
    RelayState: string;
  };

  await samlFederation.sso.handleSAMLRequest({ appId, request: SAMLRequest, relayState: RelayState });

  res.status(200).send('OK');
};
