import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

import type { Project } from 'types/retraced';
import { getToken } from '@lib/retraced';
import { retracedOptions } from '@lib/env';
import { defaultHandler } from '@lib/api';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await defaultHandler(req, res, {
    GET: getProject,
  });
}

const getProject = async (req: NextApiRequest, res: NextApiResponse) => {
  const token = await getToken(req);

  const { id } = req.query;

  const { data } = await axios.get<{ project: Project }>(
    `${retracedOptions?.hostUrl}/admin/v1/project/${id}`,
    {
      headers: {
        Authorization: `id=${token.id} token=${token.token} admin_token=${retracedOptions.adminToken}`,
      },
    }
  );

  res.status(201).json({
    data,
    error: null,
  });
};

export default handler;
