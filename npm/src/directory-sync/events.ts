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
import { createHeader, transformEventPayload } from './utils';
import axios from './axios';

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

    const { webhook } = directory;

    // If there is no webhook, then we don't need to send an event
    if (webhook.endpoint === '') {
      return;
    }

    webhookEventsLogger.setTenantAndProduct(tenant, product);

    const headers = await createHeader(webhook.secret, event);

    // Log the events only if `log_webhook_events` is enabled
    const log = directory.log_webhook_events ? await webhookEventsLogger.log(directory, event) : undefined;

    let status = 200;

    try {
      await axios.post(webhook.endpoint, event, {
        headers,
      });
    } catch (err: any) {
      status = err.response ? err.response.status : 500;
    }

    if (log) {
      await webhookEventsLogger.updateStatus(log, status);
    }
  };
};
