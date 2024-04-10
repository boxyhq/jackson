import * as Retraced from '@retracedhq/retraced';
import type { Event } from '@retracedhq/retraced';
import type { NextApiRequest } from 'next';
import { getToken as getNextAuthToken } from 'next-auth/jwt';
import requestIp from 'request-ip';

import jackson from '@lib/jackson';
import { auditLogEnabledGroup, retracedOptions } from '@lib/env';
import { sessionName } from '@lib/constants';
import { sendSecurityLogs } from '@ee/security-logs-config';
import { extractAuthToken, validateApiKey } from '@lib/auth';

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
  | 'federation.app.delete'

  // Retraced
  | 'retraced.project.create'

  // Admin settings
  | 'portal.branding.update'
  | 'portal.user.login'

  // Security Logs Config
  | 'security.logs.config.create'
  | 'security.logs.config.update'
  | 'security.logs.config.delete'

  // SaaS app
  | 'member.invitation.create'
  | 'member.invitation.delete'
  | 'member.remove'
  | 'member.update'
  | 'sso.connection.create'
  | 'sso.connection.patch'
  | 'sso.connection.delete'
  | 'dsync.connection.create'
  | 'dsync.connection.delete'
  | 'webhook.create'
  | 'webhook.delete'
  | 'webhook.update'
  | 'team.create'
  | 'team.update'
  | 'team.delete'
  | 'audit_log.splunk_connection.create'
  | 'audit_log.splunk_connection.delete'
  | 'audit_log.splunk_connection.update'
  | 'api_key.create'
  | 'api_key.delete';

interface ReportAdminEventParams {
  action: AuditEventType;
  crud: Retraced.CRUD;
  target?: Retraced.Target;
  group?: Retraced.Group;
  actor?: Retraced.Actor;
  req?: NextApiRequest;
}

interface ReportEventParams {
  action: AuditEventType;
  crud: Retraced.CRUD;
  actor: Retraced.Actor;
  req: NextApiRequest;
  group?: Retraced.Group;
  target?: Retraced.Target;
  sourceIp?: string;
  productId?: string;
}

const adminPortalGroup = {
  id: 'boxyhq-admin-portal',
  name: 'BoxyHQ Admin Portal',
};

let client: Retraced.Client | null = null;

// Check if audit log is enabled for a given group
// const auditLogEnabledFor = (groupId: string) => {
//   return auditLogEnabledGroup.includes(groupId);
// };

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

// Report events to Retraced
const reportEvent = async (params: ReportEventParams) => {
  const { action, crud, actor, sourceIp, req } = params;
  try {
    const retracedClient = await getClient();

    const retracedEvent: Event = {
      action,
      crud,
      actor,
      created: new Date(),
      source_ip: sourceIp || getClientIp(req),
    };

    if ('group' in params && params.group) {
      retracedEvent.group = params.group;
    }

    if ('target' in params && params.target) {
      retracedEvent.target = params.target;
    }

    // Find team info if productId is provided
    if ('productId' in params && params.productId) {
      const { productController } = await jackson();

      const product = await productController.get(params.productId);

      if (!product) {
        console.error(`Can't find product info for productId ${params.productId}`);
        return;
      }

      if (product.teamId && product.teamName) {
        retracedEvent.group = {
          id: product.teamId,
          name: product.teamName,
        };
      }

      if (product.id && product.name) {
        retracedEvent.target = {
          id: product.id,
          name: product.name,
        };
      }
    }

    if (!retracedEvent.group?.id) {
      return;
    }

    if (auditLogEnabledGroup.length && !auditLogEnabledGroup.includes(retracedEvent.group?.id)) {
      return;
    }

    if (retracedClient) {
      await retracedClient.reportEvent(retracedEvent);
    }

    await sendSecurityLogs(retracedEvent, retracedEvent.group?.id);
  } catch (error: any) {
    console.error('Error reporting event to Retraced', error);
  }
};

// Report Admin portal events to Retraced
export const reportAdminPortalEvent = async (params: ReportAdminEventParams) => {
  const { action, crud, target, actor, group, req } = params;

  try {
    const retracedClient = await getClient();

    const retracedEvent: Event = {
      action,
      crud,
      target,
      actor: actor ?? (await getAdminUser(req)),
      group: group || adminPortalGroup,
      created: new Date(),
    };
    const ip = getClientIp(req);

    if (ip) {
      retracedEvent['source_ip'] = ip;
    }
    if (retracedClient) {
      await retracedClient.reportEvent(retracedEvent);
    }
    await sendSecurityLogs(retracedEvent);
  } catch (error: any) {
    console.error('Error reporting event to Retraced', error);
  }
};

// Find admin actor info from NextAuth token
const getAdminUser = async (req: NextApiRequest | undefined) => {
  if (!req) {
    throw new Error(`NextApiRequest is required to get actor info for Retraced event.`);
  }

  // API keys used for admin portal routes
  if (validateApiKey(extractAuthToken(req))) {
    return {
      id: 'API',
      name: 'API',
    };
  } else {
    const user = await getNextAuthToken({
      req,
      cookieName: sessionName,
    });

    if (!user || !user.email || !user.name) {
      throw new Error(`Can't find actor info from the NextAuth token.`);
    }

    return {
      id: user.email,
      name: user.name,
    };
  }
};

// Find Ip from request
const getClientIp = (req: NextApiRequest | undefined) => {
  if (!req) {
    return;
  }

  const sourceIp = requestIp.getClientIp(req);

  if (!sourceIp.startsWith('::')) {
    return sourceIp as string;
  }
};

const retraced = {
  reportEvent,
  reportAdminPortalEvent,
};

export default retraced;