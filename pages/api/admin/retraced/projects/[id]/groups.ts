import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

import { getToken } from '@lib/retraced';
import { retracedOptions } from '@lib/env';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await getGroups(req, res);
    default:
      res.setHeader('Allow', 'GET');
      res.status(405).json({
        data: null,
        error: { message: `Method ${method} Not Allowed` },
      });
  }
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

  return res.status(200).json({
    data,
    error: null,
  });
};

export default handler;
