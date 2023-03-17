import { sendWebhookEvent } from '../event/webhook';
import type {
  DirectorySyncEventType,
  Directory,
  User,
  Group,
  EventCallback,
  DirectorySyncEvent,
  IWebhookEventsLogger,
  IDirectoryConfig,
} from '../typings';
import { transformEventPayload } from './utils';

export const sendEvent = async (
  event: DirectorySyncEventType,
  payload: { directory: Directory; group?: Group | null; user?: User | null },
  callback?: EventCallback
) => {
  const eventTransformed = transformEventPayload(event, payload);

  return callback ? await callback(eventTransformed) : Promise.resolve();
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

    webhookEventsLogger.setTenantAndProduct(tenant, product);

    // Log the events only if `log_webhook_events` is enabled
    const eventLog = directory.log_webhook_events
      ? await webhookEventsLogger.log(directory, event)
      : undefined;

    let status = 200;

    try {
      await sendWebhookEvent(directory.webhook, event);
    } catch (err: any) {
      status = err.response ? err.response.status : 500;
    }

    if (eventLog) {
      await webhookEventsLogger.updateStatus(eventLog, status);
    }
  };
};
