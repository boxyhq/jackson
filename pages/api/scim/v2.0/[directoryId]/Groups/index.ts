import type { NextApiRequest, NextApiResponse } from 'next';
import type { HTTPMethod } from '@lib/jackson';
import jackson from '@lib/jackson';
import { extractAuthToken } from '@lib/auth';
import { bodyParser } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { directorySync } = await jackson();
  const { method } = req;
  const { directoryId } = req.query;

  if (!(await directorySync.directories.validateAPISecret(directoryId as string, extractAuthToken(req)))) {
    return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
  }

  const request = {
    method: method as HTTPMethod,
    body: bodyParser(req),
    query: {
      count: parseInt(req.query.count as string),
      startIndex: parseInt(req.query.startIndex as string),
      directory_id: directoryId as string,
    },
  };

  const { status, data } = await directorySync.groupsRequest.handle(request);

  return res.status(status).json(data);
}
