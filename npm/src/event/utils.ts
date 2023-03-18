import type { Directory, DsyncConnectionEventData, SSOConnectionEventData, SAMLSSORecord } from '../typings';
import { findFriendlyProviderName } from '../controller/utils';

export const transformSSOConnection = (data: SAMLSSORecord): SSOConnectionEventData => {
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

export const transformDirectoryConnection = (data: Directory): DsyncConnectionEventData => {
  const { id, name, type } = data;

  return {
    id,
    name,
    type,
  };
};
