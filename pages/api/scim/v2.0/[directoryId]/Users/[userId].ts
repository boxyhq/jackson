import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { extractAuthToken } from '@lib/auth';
import { bodyParser } from '@lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { directorySync } = await jackson();
  const { method } = req;
  const { directoryId, userId } = req.query;

  if (!(await directorySync.directories.validateAPISecret(directoryId as string, extractAuthToken(req)))) {
    return res.status(401).json({ data: null, error: { message: 'Unauthorized' } });
  }

  const request = {
    method: method as string,
    directory_id: directoryId as string,
    user_id: userId as string,
    body: bodyParser(req),
  };

  const { status, data } = await directorySync.usersRequest.handle(request);

  return res.status(status).json(data);
}
