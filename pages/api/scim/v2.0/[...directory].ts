import type { NextApiRequest, NextApiResponse } from 'next';
import type { HTTPMethod, DirectorySyncUserRequest, DirectorySyncGroupRequest } from '@lib/jackson';
import jackson from '@lib/jackson';
import { extractAuthToken } from '@lib/auth';
import { bodyParser } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { directorySyncController } = await jackson();

  const { method, query } = req;
  const directory = query.directory as string[];

  const [directoryId, path, resourceId] = directory;

  // Validate the SCIM API request token
  if (
    !(await directorySyncController.directories.validateAPISecret(
      directoryId as string,
      extractAuthToken(req)
    ))
  ) {
    return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
  }

  const callback = directorySyncController.events.callback;

  // Handle requests to /Users
  if (path === 'Users') {
    const request = {
      method: method as HTTPMethod,
      body: bodyParser(req),
      query: {
        directory_id: directoryId,
        user_id: resourceId,
        count: parseInt(req.query.count as string),
        startIndex: parseInt(req.query.startIndex as string),
        filter: req.query.filter as string,
      } as DirectorySyncUserRequest['query'],
    };

    const { status, data } = await directorySyncController.usersRequest.handle(request, callback);

    return res.status(status).json(data);
  }

  // Handle requests to /Groups
  if (path === 'Groups') {
    const request = {
      method: method as HTTPMethod,
      body: bodyParser(req),
      query: {
        directory_id: directoryId,
        group_id: resourceId,
        count: parseInt(req.query.count as string),
        startIndex: parseInt(req.query.startIndex as string),
        filter: req.query.filter as string,
      } as DirectorySyncGroupRequest['query'],
    };

    const { status, data } = await directorySyncController.groupsRequest.handle(request, callback);

    return res.status(status).json(data);
  }
}
