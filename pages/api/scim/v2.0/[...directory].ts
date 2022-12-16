import type { NextApiRequest, NextApiResponse } from 'next';
import type { HTTPMethod, DirectorySyncRequest } from '@boxyhq/saml-jackson';
import jackson from '@lib/jackson';
import { extractAuthToken } from '@lib/auth';
import { bodyParser } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { directorySyncController } = await jackson();

  const { method, query } = req;

  const params = query.directory as string[];

  const [directoryId, path, resourceId] = params;

  // Handle the SCIM API requests
  const request: DirectorySyncRequest = {
    method: method as HTTPMethod,
    body: bodyParser(req),
    directoryId,
    resourceId,
    resourceType: path === 'Users' ? 'users' : 'groups',
    apiSecret: extractAuthToken(req),
    query: {
      count: req.query.count ? parseInt(req.query.count as string) : undefined,
      startIndex: req.query.startIndex ? parseInt(req.query.startIndex as string) : undefined,
      filter: req.query.filter as string,
    },
  };

  const { status, data } = await directorySyncController.requests.handle(
    request,
    directorySyncController.events.callback
  );

  return res.status(status).json(data);
}
