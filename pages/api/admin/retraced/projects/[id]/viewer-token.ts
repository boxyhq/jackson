import type { NextApiRequest, NextApiResponse } from 'next';
import * as Retraced from 'retraced';

import env from '@lib/env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getViewerToken(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({
        data: null,
        error: { message: `Method ${method} Not Allowed` },
      });
  }
}

// Get A viewer token and send it to the client, the client will use this token to initialize the logs-viewer
const getViewerToken = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id: projectId, groupId, token } = req.query;

  const retraced = new Retraced.Client({
    apiKey: token as string,
    projectId: projectId as string,
    endpoint: env.retraced.host,
  });

  const viewerToken = await retraced.getViewerToken(groupId as string, '', true);

  return res.status(200).json({
    data: {
      viewerToken,
    },
    error: null,
  });
};
