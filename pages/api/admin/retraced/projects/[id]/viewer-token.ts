import type { NextApiRequest, NextApiResponse } from 'next';
import * as Retraced from '@retracedhq/retraced';

import { retracedOptions } from '@lib/env';
import { defaultHandler } from '@lib/api';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await defaultHandler(req, res, {
    GET: getViewerToken,
  });
}

// Get A viewer token and send it to the client, the client will use this token to initialize the logs-viewer
const getViewerToken = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id: projectId, groupId, token } = req.query;

  // TODO: Move to global
  const retraced = new Retraced.Client({
    apiKey: token as string,
    projectId: projectId as string,
    endpoint: retracedOptions?.hostUrl,
    viewLogAction: 'audit.log.view',
  });

  const viewerToken = await retraced.getViewerToken(groupId as string, 'Admin-Portal', true);

  res.json({
    data: {
      viewerToken,
    },
    error: null,
  });
};

export default handler;
