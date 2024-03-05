import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

import type { Project } from 'types/retraced';
import { getToken } from '@lib/retraced';
import { retracedOptions } from '@lib/env';
import { adminHandler } from '@lib/api/adminHandler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await adminHandler(req, res, {
    GET: handleGET,
    POST: handlePOST,
  });
}

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const token = await getToken(req);

  const { name } = req.body;

  const { data } = await axios.post<{ project: Project }>(
    `${retracedOptions?.hostUrl}/admin/v1/project`,
    {
      name,
    },
    {
      headers: {
        Authorization: `id=${token.id} token=${token.token} admin_token=${retracedOptions.adminToken}`,
      },
    }
  );

  res.status(201).json({
    data,
  });
};

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const token = await getToken(req);

  const { offset, limit } = req.query as {
    offset: string;
    limit: string;
  };

  const { data } = await axios.get<{ projects: Project[] }>(
    `${retracedOptions?.hostUrl}/admin/v1/projects?offset=${+(offset || 0)}&limit=${+(limit || 0)}`,
    {
      headers: {
        Authorization: `id=${token.id} token=${token.token} admin_token=${retracedOptions.adminToken}`,
      },
    }
  );

  res.json({
    data,
  });
};

export default handler;
