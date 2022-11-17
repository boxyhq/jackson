import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'POST':
      return handlePOST(req, res);
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
}

// Handle the SAML Response from Identity Provider
// This endpoint act as Assertion Consumer Service (ACS) URL
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { samlFederated } = await jackson();

  const { SAMLResponse, RelayState } = req.body as {
    SAMLResponse: string;
    RelayState: string;
  };

  const { htmlForm } = await samlFederated.sso.generateSAMLResponseForm({
    response: SAMLResponse,
    relayState: RelayState,
  });

  res.send(htmlForm);
};
