import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

import { getToken } from '@lib/retraced';
import { retracedOptions } from '@lib/env';
import { defaultHandler } from '@lib/api';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await defaultHandler(req, res, {
    GET: getGroups,
  });
}

const getGroups = async (req: NextApiRequest, res: NextApiResponse) => {
  const token = await getToken(req);

  const { id: projectId, environmentId } = req.query;

  const { data } = await axios.get(
    `${retracedOptions?.hostUrl}/admin/v1/project/${projectId}/groups?environment_id=${environmentId}`,
    {
      headers: {
        Authorization: `id=${token.id} token=${token.token} admin_token=${retracedOptions.adminToken}`,
      },
      data: {
        query: {
          length: 10,
          offset: 0,
        },
      },
    }
  );

  res.json({
    data,
    error: null,
  });
};

export default handler;
