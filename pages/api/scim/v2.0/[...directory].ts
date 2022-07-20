import type { NextApiRequest, NextApiResponse } from 'next';
import type { HTTPMethod } from '@lib/jackson';
import jackson from '@lib/jackson';
import { extractAuthToken } from '@lib/auth';
import { bodyParser } from '@lib/utils';
import { DirectorySyncUserRequest } from 'npm/src';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { directorySyncController } = await jackson();

  const directorySync = directorySyncController;

  const { method, query } = req;
  const directory = query.directory as string[];

  const [directoryId, endpoint, resourceId] = directory;

  if (!(await directorySync.directories.validateAPISecret(directoryId as string, extractAuthToken(req)))) {
    return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
  }

  if (endpoint === 'Users') {
    const request = {
      method: method as HTTPMethod,
      body: bodyParser(req),
      query: {
        directory_id: directoryId,
        count: parseInt(req.query.count as string),
        startIndex: parseInt(req.query.startIndex as string),
        filter: req.query.filter as string,
        user_id: resourceId,
      } as DirectorySyncUserRequest['query'],
    };

    const { status, data } = await directorySync.usersRequest.handle(request, directorySync.events.handle);

    return res.status(status).json(data);
  }
}
