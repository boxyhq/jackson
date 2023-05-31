import type {
  DirectorySyncEventType,
  Directory,
  User,
  Group,
  EventCallback,
  DirectorySyncEvent,
  IWebhookEventsLogger,
  IDirectoryConfig,
} from '../../typings';
import { sendPayloadToWebhook } from '../../event/webhook';
import { transformEventPayload } from './transform';
import { isConnectionActive } from '../../controller/utils';

type Payload = { directory: Directory; group?: Group | null; user?: User | null };

export const sendEvent = async (
  event: DirectorySyncEventType,
  payload: Payload,
  callback?: EventCallback
) => {
  if (!isConnectionActive(payload.directory)) {
    return;
  }

  if (!callback) {
    return;
  }

  await callback(transformEventPayload(event, payload));
};

export const handleEventCallback = async (
  directories: IDirectoryConfig,
  webhookEventsLogger: IWebhookEventsLogger
) => {
  return async (event: DirectorySyncEvent) => {
    const { tenant, product, directory_id: directoryId } = event;

    const { data: directory } = await directories.get(directoryId);

    if (!directory) {
      return;
    }

    if (!directory.webhook.endpoint || !directory.webhook.secret) {
      return;
    }

    let status = 200;

    try {
      await sendPayloadToWebhook(directory.webhook, event);
    } catch (err: any) {
      status = err.response ? err.response.status : 500;
    }

    if (directory.log_webhook_events) {
      await webhookEventsLogger.setTenantAndProduct(tenant, product).log(directory, event, status);
    }
  };
};
