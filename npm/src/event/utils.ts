import type {
  Directory,
  DsyncConnectionEventSchema,
  SSOConnectionEventSchema,
  SAMLSSORecord,
} from '../typings';
import { findFriendlyProviderName } from '../controller/utils';

export const transformSSOConnection = (data: SAMLSSORecord): SSOConnectionEventSchema => {
  const { name, description, clientID, clientSecret, idpMetadata } = data;
  const { entityID, provider } = idpMetadata;

  return {
    name,
    description,
    clientID,
    clientSecret,
    entityID,
    provider,
    friendlyProviderName: findFriendlyProviderName(provider),
  };
};

export const transformDirectoryConnection = (data: Directory): DsyncConnectionEventSchema => {
  const { id, name, type } = data;

  return {
    id,
    name,
    type,
  };
};
