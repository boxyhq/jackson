import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

import type { Project } from 'types/retraced';
import { getToken } from '@lib/retraced';
import { retracedOptions } from '@lib/env';
import { sendAudit } from '@ee/audit-log/lib/retraced';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getProjects(req, res);
    case 'POST':
      return createProject(req, res);
    default:
      res.setHeader('Allow', 'GET, POST');
      res.status(405).json({
        error: { message: `Method ${method} Not Allowed` },
      });
  }
}

const createProject = async (req: NextApiRequest, res: NextApiResponse) => {
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

  await sendAudit({
    action: 'retraced.project.create',
    crud: 'c',
    req,
  });

  return res.status(201).json({
    data,
  });
};

const getProjects = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
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

    await sendAudit({
      action: 'retraced.project.view',
      crud: 'r',
      req,
    });

    return res.status(200).json({
      data,
    });
  } catch (ex: any) {
    return res.status(500).json({
      error: {
        message: ex?.message || ex?.response?.message || ex,
      },
    });
  }
};

export default handler;
