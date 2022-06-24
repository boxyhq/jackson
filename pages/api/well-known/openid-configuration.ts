import type { NextApiRequest, NextApiResponse } from 'next';
import env from '@lib/env';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    issuer: env.samlAudience,
    authorization_endpoint: 'https://example.com/oauth2/authorize',
    token_endpoint: `${env.externalUrl}/api/oauth/token`,
    userinfo_endpoint: `${env.externalUrl}/api/oauth/userinfo`,
    jwks_uri: `${env.externalUrl}/api/jwks`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
  });
}
