import { Issuer, type IssuerMetadata } from 'openid-client';
import { JacksonError } from '../error';

export const oidcIssuerInstance = async (discoveryUrl?: string, metadata?: IssuerMetadata) => {
  if (discoveryUrl) {
    return await Issuer.discover(discoveryUrl);
  }
  if (metadata) {
    return new Issuer(metadata);
  }
  throw new JacksonError('Neither "discoveryUrl" nor "metadata" set for the OIDC issuer', 500);
};
