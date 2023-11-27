import * as Retraced from '@retracedhq/retraced';
import type { Event } from '@retracedhq/retraced';

import jackson from '@lib/jackson';
import { retracedOptions } from '@lib/env';
import type { AuditEventType } from 'types/retraced';

interface ReportEventParams extends Event {
  action: AuditEventType;
  productId: string;
}

// Cache retraced client
let client: Retraced.Client | null = null;

// Create a Retraced client
const getClient = async () => {
  if (!retracedOptions.hostUrl || !retracedOptions.apiKey || !retracedOptions.projectId) {
    return;
  }

  if (client) {
    return client;
  }

  client = new Retraced.Client({
    endpoint: retracedOptions.hostUrl,
    apiKey: retracedOptions.apiKey,
    projectId: retracedOptions.projectId,
  });

  return client;
};

// Send an event to Retraced
const reportEvent = async ({ action, crud, group, actor, description, productId }: ReportEventParams) => {
  try {
    const retracedClient = await getClient();

    if (!retracedClient) {
      return;
    }

    const { checkLicense, productController } = await jackson();

    if (!(await checkLicense())) {
      throw new Error('BoxyHQ license not valid. Cannot report event to Retraced.');
    }

    const retracedEvent: Event = {
      action,
      crud,
      group,
      actor,
      description,
      created: new Date(),
    };

    // Find team info for the product
    if (productId && !group) {
      try {
        const product = await productController.get(productId);

        retracedEvent.group = {
          id: product.teamId,
          name: product.teamName,
        };

        retracedEvent.target = {
          id: product.id,
          name: product.name,
        };
      } catch (err: any) {
        console.error('Error getting product info. Event not reported to Retraced.', err);
      }
    }

    await retracedClient.reportEvent(retracedEvent);
  } catch (error: any) {
    console.error(error);
  }
};

const retraced = {
  getClient,
  reportEvent,
};

export default retraced;
