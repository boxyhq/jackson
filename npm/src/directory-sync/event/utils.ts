import type {
  DirectorySyncEventType,
  Directory,
  User,
  Group,
  EventCallback,
  DirectorySyncEvent,
  IWebhookEventsLogger,
  IDirectoryConfig,
  JacksonOption,
  IEventProcessor,
} from '../../typings';
import { sendPayloadToWebhook } from '../../event/webhook';
import { transformEventPayload } from '../scim/transform';
import { isConnectionActive } from '../../controller/utils';

export const eventLockTTL = 6;

interface Payload {
  directory: Directory;
  group?: Group | null;
  user?: User | null;
}

interface EventCallbackParams {
  opts: JacksonOption;
  directories: IDirectoryConfig;
  eventProcessor: IEventProcessor;
  webhookLogs: IWebhookEventsLogger;
}

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

export const handleEventCallback = async ({
  opts,
  directories,
  eventProcessor,
  webhookLogs,
}: EventCallbackParams) => {
  // Callback that handles the events for Jackson service
  return async (event: DirectorySyncEvent) => {
    const { tenant, product, directory_id: directoryId } = event;

    const { data: directory } = await directories.get(directoryId);

    if (!directory) {
      return;
    }

    // If bulk sync is enabled, push the event to the queue
    // We will process the queue later in the background
    if (opts.dsync?.webhookBatchSize) {
      await eventProcessor.push(event);
      return;
    }

    if (!directory.webhook.endpoint || !directory.webhook.secret) {
      return;
    }

    let status = 200;

    try {
      // Send the event to the webhook (synchronously)
      await sendPayloadToWebhook(directory.webhook, event);
    } catch (err: any) {
      status = err.response ? err.response.status : 500;
    }

    if (directory.log_webhook_events) {
      await webhookLogs.setTenantAndProduct(tenant, product).log(directory, event, status);
    }
  };
};
