import type {
  Directory,
  JacksonOption,
  SAMLSSORecord,
  EventType,
  SSOConnectionEventType,
  EventData,
  Webhook,
  EventPayloadSchema,
  OIDCSSORecord,
} from '../typings';
import { sendPayloadToWebhook } from './webhook';
import {
  transformSAMLSSOConnection,
  transformDirectoryConnection,
  transformOIDCSSOConnection,
} from './utils';

export default class Event {
  private webhook: JacksonOption['webhook'];

  constructor({ opts }: { opts: JacksonOption }) {
    this.webhook = opts.webhook;
  }

  async notify<T extends EventType>(
    event: T,
    data: T extends SSOConnectionEventType ? SAMLSSORecord | OIDCSSORecord : Directory
  ) {
    const payload = this._constructPayload(event, data);

    this.sendWebhookEvent(this.webhook, payload);
  }

  async sendWebhookEvent(webhook: Webhook | undefined, payload: EventPayloadSchema) {
    return await sendPayloadToWebhook(webhook, payload);
  }

  private _constructPayload(event: EventType, data: SAMLSSORecord | OIDCSSORecord | Directory) {
    let transformedData: EventData;

    if ('idpMetadata' in data) {
      transformedData = transformSAMLSSOConnection(data);
    } else if ('oidcProvider' in data) {
      transformedData = transformOIDCSSOConnection(data);
    } else {
      transformedData = transformDirectoryConnection(data);
    }

    const { tenant, product } = data;

    const payload: EventPayloadSchema = {
      event,
      tenant,
      product,
      data: transformedData,
    };

    return payload;
  }
}
