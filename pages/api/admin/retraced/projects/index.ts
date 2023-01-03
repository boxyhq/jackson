import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

import type { Project } from 'types/retraced';
import { getToken } from '@lib/retraced';
import { retracedOptions } from '@lib/env';
import { checkSession } from '@lib/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getProjects(req, res);
    case 'POST':
      return createProject(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({
        data: null,
        error: { message: `Method ${method} Not Allowed` },
      });
  }
}

const createProject = async (req: NextApiRequest, res: NextApiResponse) => {
  const token = await getToken(req);

  const { name } = req.body;

  const { data } = await axios.post<{ project: Project }>(
    `${retracedOptions?.host}/admin/v1/project`,
    {
      name,
    },
    {
      headers: {
        Authorization: `id=${token.id} token=${token.token} admin_token=${retracedOptions.adminToken}`,
      },
    }
  );

  return res.status(201).json({
    data,
    error: null,
  });
};

const getProjects = async (req: NextApiRequest, res: NextApiResponse) => {
  const token = await getToken(req);

  const { data } = await axios.get<{ projects: Project[] }>(`${retracedOptions?.host}/admin/v1/projects`, {
    headers: {
      Authorization: `id=${token.id} token=${token.token} admin_token=${retracedOptions.adminToken}`,
    },
  });

  return res.status(200).json({
    data,
    error: null,
  });
};

export default checkSession(handler);
