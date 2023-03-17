import EventController from '../event';
import type { Directory, DirectorySyncEventType, SAMLSSORecord, DirectorySyncEventSchema } from '../typings';

export type IEventController = InstanceType<typeof EventController>;

export type SSOConnectionEventType = 'sso.created' | 'sso.deleted' | 'sso.activated' | 'sso.deactivated';

export type DsyncConnectionEventType =
  | 'dsync.created'
  | 'dsync.deleted'
  | 'dsync.activated'
  | 'dsync.deactivated';

export type EventType = SSOConnectionEventType | DsyncConnectionEventType | DirectorySyncEventType;

export type SSOConnectionEventSchema = Pick<
  SAMLSSORecord,
  'name' | 'description' | 'clientID' | 'clientSecret'
> & {
  entityID: string;
  provider: string;
  friendlyProviderName: string;
};

export type DsyncConnectionEventSchema = Pick<Directory, 'id' | 'name' | 'type'>;

export type EventSchema = SSOConnectionEventSchema | DsyncConnectionEventSchema | DirectorySyncEventSchema;

export type EventPayloadSchema = {
  tenant: string;
  product: string;
  event: EventType;
  data: EventSchema;
};
