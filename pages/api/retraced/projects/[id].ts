import type { NextApiRequest, NextApiResponse } from 'next';
import type { Project } from 'types';
import axios from 'axios';
import { getToken } from '@lib/retraced';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getProject(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({
        data: null,
        error: { message: `Method ${method} Not Allowed` },
      });
  }
}

const getProject = async (req: NextApiRequest, res: NextApiResponse) => {
  const token = await getToken();
  const { id } = req.query;

  const config = {
    headers: {
      Authorization: `id=${token.id} token=${token.token}`,
    },
  };

  const { data: project } = await axios.get<Project>(
    `${process.env.RETRACED_HOST}/admin/v1/project/${id}`,
    config
  );

  return res.status(201).json({
    data: project,
    error: null,
  });
};
