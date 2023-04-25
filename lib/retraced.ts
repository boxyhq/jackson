import axios from 'axios';
import type { NextApiRequest } from 'next';
import { getToken as getNextAuthToken } from 'next-auth/jwt';
import * as Retraced from '@retracedhq/retraced';
import type { Event } from '@retracedhq/retraced';

import type { AdminToken, Request } from 'types/retraced';
import { retracedOptions } from './env';
import { sessionName } from './constants';

export const retracedClient = new Retraced.Client({
  endpoint: retracedOptions.hostUrl,
  apiKey: `${retracedOptions.apiKey}`,
  projectId: `${retracedOptions.projectId}`,
});

export const getToken = async (req: NextApiRequest): Promise<AdminToken> => {
  const token = await getNextAuthToken({
    req,
    cookieName: sessionName,
  });

  const { data } = await axios.post<{ adminToken: AdminToken }>(
    `${retracedOptions?.hostUrl}/admin/v1/user/_login`,
    {
      claims: {
        upstreamToken: 'ADMIN_ROOT_TOKEN',
        email: token!.email,
      },
    },
    {
      headers: {
        Authorization: `token=${retracedOptions?.adminToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return data.adminToken;
};

// Send an event to Retraced
export const sendAudit = async (request: Request) => {
  if (!retracedOptions.hostUrl || !retracedOptions.apiKey || !retracedOptions.projectId) {
    return;
  }

  const { action, req, crud } = request;

  const token = await getNextAuthToken({
    req,
    cookieName: sessionName,
  });

  if (!token || !token.email || !token.name) {
    return;
  }

  const group = {
    id: 'boxyhq-admin-portal',
    name: 'BoxyHQ Admin Portal',
  };

  const actor = {
    id: token.email,
    name: token.name,
  };

  // TODO: Add IP address and Target to event
  const event: Event = {
    action,
    crud,
    group,
    actor,
  };

  return await retracedClient.reportEvent(event);
};
