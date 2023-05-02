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

// Find the actor for the event from the request
const findActorFromRequest = async (req: NextApiRequest): Promise<Retraced.Actor | null> => {
  const token = await getNextAuthToken({
    req,
    cookieName: sessionName,
  });

  if (token && token.email && token.name) {
    return {
      id: token.email,
      name: token.name,
    };
  }

  return null;
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
    group: adminPortalGroup,
  };

  let requestActor: Retraced.Actor | null = null;

  if (req) {
    requestActor = await findActorFromRequest(req);
  } else if (actor) {
    requestActor = { ...actor };
  }

  if (requestActor) {
    event['actor'] = requestActor;
  } else {
    event['is_anonymous'] = true;
  }

  return await retracedClient.reportEvent(event);
};
