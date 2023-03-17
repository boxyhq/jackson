import type {
  Directory,
  JacksonOption,
  SAMLSSORecord,
  EventType,
  SSOConnectionEventType,
  EventSchema,
} from '../typings';
import { sendWebhookEvent } from './webhook';
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

    await sendWebhookEvent(this.webhook, payload);
  }
}
