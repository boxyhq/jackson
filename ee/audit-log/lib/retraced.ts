import { getToken as getNextAuthToken } from 'next-auth/jwt';
import * as Retraced from '@retracedhq/retraced';
import type { Event } from '@retracedhq/retraced';
import type { NextApiRequest } from 'next';

import jackson from '@lib/jackson';
import type { Request } from 'types/retraced';
import { retracedOptions } from '@lib/env';
import { sessionName } from '@lib/constants';

// Group for all events sent from the Admin Portal
export const adminPortalGroup = {
  id: 'boxyhq-admin-portal',
  name: 'BoxyHQ Admin Portal',
};

// Create a new client
export const retracedClient = new Retraced.Client({
  endpoint: retracedOptions.hostUrl,
  apiKey: `${retracedOptions.apiKey}`,
  projectId: `${retracedOptions.projectId}`,
});

// Find the actor for the event from the request
const findActor = async (req: NextApiRequest) => {
  const token = await getNextAuthToken({
    req,
    cookieName: sessionName,
  });

  if (!token || !token.email || !token.name) {
    return {
      id: 'An unknown actor',
    };
  }

  return {
    id: token.email,
    name: token.name,
  };
};

// Get a viewer token for the current user to access the logs viewer
export const getViewerToken = async (req: NextApiRequest) => {
  const token = await getNextAuthToken({
    req,
    cookieName: sessionName,
  });

  if (!token || !token.email) {
    return null;
  }

  return await retracedClient.getViewerToken(adminPortalGroup.id, token.email, true);
};

// Send an event to Retraced
export const sendAudit = async (request: Request) => {
  const { checkLicense } = await jackson();

  if (!retracedOptions.hostUrl || !retracedOptions.apiKey || !retracedOptions.projectId) {
    return;
  }

  if (!(await checkLicense())) {
    return;
  }

  const { action, crud, req, actor } = request;

  // TODO: Add IP address and Target to event
  const event: Event = {
    action,
    crud,
    actor: req ? await findActor(req) : actor,
    group: adminPortalGroup,
  };

  return await retracedClient.reportEvent(event);
};
