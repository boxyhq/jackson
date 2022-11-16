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
// This endpoint act as Single Sign On (SSO) URL
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederation } = await jackson();

  const { SAMLRequest, RelayState } = req.query as {
    SAMLRequest: string;
    RelayState: string;
  };

  const { data: session } = await samlFederation.sso.parseSAMLRequest({
    request: SAMLRequest,
    relayState: RelayState,
  });

  const {
    data: { url },
  } = await samlFederation.sso.createSAMLRequest(session);

  return res.redirect(url);
};
