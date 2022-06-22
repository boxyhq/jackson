import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    issuer: 'https://example.com',
    authorization_endpoint: 'https://example.com/oauth2/authorize',
    token_endpoint: '',
    userinfo_endpoint: '',
    jwks_uri: '',
    response_types_supported: '',
    subject_types_supported: '',
    id_token_signing_alg_values_supported: '',
  });
}
