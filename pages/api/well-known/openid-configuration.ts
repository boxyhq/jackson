import type { NextApiRequest, NextApiResponse } from 'next';
import env from '@lib/env';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).send(
    JSON.stringify(
      {
        issuer: env.samlAudience,
        authorization_endpoint: `${env.externalUrl}/api/oauth/authorize`,
        token_endpoint: `${env.externalUrl}/api/oauth/token`,
        userinfo_endpoint: `${env.externalUrl}/api/oauth/userinfo`,
        jwks_uri: `${env.externalUrl}/oauth/jwks`,
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        grant_types_supported: ['authorization_code'],
        code_challenge_methods_supported: ['plain', 'S256'],
      },
      null,
      2
    )
  );
}
