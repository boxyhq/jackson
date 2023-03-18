import type {
  Directory,
  JacksonOption,
  SAMLSSORecord,
  EventType,
  SSOConnectionEventType,
  EventSchema,
  Webhook,
  EventPayloadSchema,
} from '../typings';
import { sendPayloadToWebhook } from './webhook';
import { transformSSOConnection, transformDirectoryConnection } from './utils';

export default class Event {
  private webhook: JacksonOption['webhook'];

  constructor({ opts }: { opts: JacksonOption }) {
    this.webhook = opts.webhook;
  }

  async notify<T extends EventType>(
    event: T,
    data: T extends SSOConnectionEventType ? SAMLSSORecord : Directory
  ) {
    let transformedData: EventSchema;

    if ('clientID' in data) {
      transformedData = transformSSOConnection(data);
    } else {
      transformedData = transformDirectoryConnection(data);
    }

    const { tenant, product } = data;

    const payload = {
      event,
      tenant,
      product,
      data: transformedData,
    };

    this.sendWebhookEvent(this.webhook, payload);
  }

  async sendWebhookEvent(webhook: Webhook | undefined, payload: EventPayloadSchema) {
    return await sendPayloadToWebhook(webhook, payload);
  }
}
