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
      return getProject(req, res);
    default:
      res.setHeader('Allow', 'GET');
      res.status(405).json({
        data: null,
        error: { message: `Method ${method} Not Allowed` },
      });
  }
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

  sendAudit({
    action: 'retraced.project.view',
    crud: 'r',
    req,
  });

  return res.status(201).json({
    data,
    error: null,
  });
};

export default handler;
