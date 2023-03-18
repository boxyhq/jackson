import EventController from '../event';
import type { Directory, DirectorySyncEventType, SAMLSSORecord, DirectorySyncEventData } from '../typings';

export type IEventController = InstanceType<typeof EventController>;

export type SSOConnectionEventType = 'sso.created' | 'sso.deleted' | 'sso.activated' | 'sso.deactivated';

export type DsyncConnectionEventType =
  | 'dsync.created'
  | 'dsync.deleted'
  | 'dsync.activated'
  | 'dsync.deactivated';

export type EventType = SSOConnectionEventType | DsyncConnectionEventType | DirectorySyncEventType;

export type SSOConnectionEventData = Pick<
  SAMLSSORecord,
  'name' | 'description' | 'clientID' | 'clientSecret'
> & {
  entityID: string;
  provider: string;
  friendlyProviderName: string;
};

export type DsyncConnectionEventData = Pick<Directory, 'id' | 'name' | 'type'>;

export type EventData = SSOConnectionEventData | DsyncConnectionEventData | DirectorySyncEventData;

export type EventPayloadSchema = {
  tenant: string;
  product: string;
  event: EventType;
  data: EventData;
};
