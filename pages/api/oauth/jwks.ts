import { NextApiRequest, NextApiResponse } from 'next';
import env from '@lib/env';
import { exportPublicKeyJWK, generateJwkThumbprint, importJWTPublicKey } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const importedPublicKey = await importJWTPublicKey(env.openid.jwtSigningKeys.public);
  const publicKeyJWK = await exportPublicKeyJWK(importedPublicKey);
  const jwkThumbprint = await generateJwkThumbprint(publicKeyJWK);
  const jwks = JSON.stringify(
    { keys: [{ ...publicKeyJWK, kid: jwkThumbprint, alg: env.openid.jwsAlg, use: 'sig' }] },
    null,
    2
  );
  res.status(200).setHeader('Content-Type', 'application/json').send(jwks);
}
