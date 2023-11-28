import * as Retraced from '@retracedhq/retraced';
import type { Event } from '@retracedhq/retraced';
import type { NextApiRequest } from 'next';
import { getToken as getNextAuthToken } from 'next-auth/jwt';
// import requestIp from 'request-ip';

import jackson from '@lib/jackson';
import { retracedOptions } from '@lib/env';
import { sessionName } from '@lib/constants';

export const adminPortalGroup = {
  id: 'boxyhq-admin-portal',
  name: 'BoxyHQ Admin Portal',
};

type AuditEventType =
  | 'sso.user.login'

  // Single Sign On
  | 'sso.connection.create'
  | 'sso.connection.update'
  | 'sso.connection.delete'

  // Directory Sync
  | 'dsync.connection.create'
  | 'dsync.connection.update'
  | 'dsync.connection.delete'
  | 'dsync.webhook_event.delete'

  // Setup Link
  | 'sso.setuplink.create'
  | 'sso.setuplink.update'
  | 'sso.setuplink.delete'
  | 'dsync.setuplink.create'
  | 'dsync.setuplink.update'
  | 'dsync.setuplink.delete'

  // Federated SAML
  | 'federation.app.create'
  | 'federation.app.update'
  | 'federation.app.delete';

type ReportAdminEventParams = {
  action: AuditEventType;
  crud: Retraced.CRUD;
  target?: Retraced.Target;
  req: NextApiRequest;
};

interface ReportEventParams extends Event {
  action: AuditEventType;
  productId: string;
}

// Cache retraced client
let client: Retraced.Client | null = null;

// Create a Retraced client
const getClient = async () => {
  const { checkLicense } = await jackson();

  if (!(await checkLicense())) {
    return;
  }

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
      const { productController } = await jackson();

      const product = await productController.get(productId);

      retracedEvent.group = {
        id: product.teamId,
        name: product.teamName,
      };

      retracedEvent.target = {
        id: product.id,
        name: product.name,
      };
    }

    await retracedClient.reportEvent(retracedEvent);
  } catch (error: any) {
    console.error('Error reporting event to Retraced', error);
  }
};

// Report Admin portal events to Retraced
export const reportAdminPortalEvent = async ({ action, crud, target, req }: ReportAdminEventParams) => {
  try {
    const retracedClient = await getClient();

    if (!retracedClient) {
      return;
    }

    // Get actor info
    const user = await getNextAuthToken({
      req,
      cookieName: sessionName,
    });

    if (!user || !user.email || !user.name) {
      console.error(`Can't find actor info for Retraced event.`);
      return;
    }

    const retracedEvent: Event = {
      action,
      crud,
      target,
      group: adminPortalGroup,
      created: new Date(),
      actor: {
        id: user.email,
        name: user.name,
      },
      //source_ip: process.env.NODE_ENV === 'development' ? null : requestIp.getClientIp(req),
    };

    console.log('Retraced event', retracedEvent);

    await retracedClient.reportEvent(retracedEvent);
  } catch (error: any) {
    console.error('Error reporting event to Retraced', error);
  }
};

const retraced = {
  getClient,
  reportEvent,
  reportAdminPortalEvent,
};

export default retraced;
