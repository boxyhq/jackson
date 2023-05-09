import { getToken as getNextAuthToken } from 'next-auth/jwt';
import * as Retraced from '@retracedhq/retraced';
import type { Event } from '@retracedhq/retraced';
import type { NextApiRequest } from 'next';

import jackson from '@lib/jackson';
import type { Request } from 'types/retraced';
import { sessionName } from '@lib/constants';
import { getRetracedClient } from './retracedClient';

// Group for all events sent from the Admin Portal
export const adminPortalGroup = {
  id: 'boxyhq-admin-portal',
  name: 'BoxyHQ Admin Portal',
};

// Get a viewer token for the current user to access the logs viewer
export const getViewerToken = async (req: NextApiRequest) => {
  const retracedClient = await getRetracedClient();

  const token = await getNextAuthToken({
    req,
    cookieName: sessionName,
  });

  if (!token || !token.email) {
    return null;
  }

  try {
    return await retracedClient.getViewerToken(adminPortalGroup.id, token.email, true);
  } catch (err: any) {
    throw new Error(
      'Unable to get viewer token from Retraced. Please check your environment variables and try again.'
    );
  }
};

// Send an event to Retraced
export const sendAudit = async (request: Request) => {
  const { checkLicense } = await jackson();

  if (!(await checkLicense())) {
    return;
  }

  try {
    const retracedClient = await getRetracedClient();

    const { action, crud, req, actor } = request;

    // TODO: Add IP address and Target to event
    const event: Event = {
      action,
      crud,
      group: adminPortalGroup,
      created: new Date(),
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

    console.log(event);

    return await retracedClient.reportEvent(event);
  } catch (err: any) {
    //
  }
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
