import type { NextApiRequest, NextApiResponse } from 'next';
import type { Project } from 'types';
import { getToken } from '@lib/retraced';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
  const token = await getToken();

  const { name } = req.body;

  const body = {
    name,
  };

  const config = {
    headers: {
      Authorization: `id=${token.user.id} token=${token.token}`,
    },
  };

  const { data: project } = await axios.post<Project>(
    `${process.env.RETRACED_HOST}/admin/v1/project`,
    body,
    config
  );

  return res.status(201).json({
    data: project,
    error: null,
  });
};

const getProjects = async (req: NextApiRequest, res: NextApiResponse) => {
  const token = await getToken();

  const config = {
    headers: {
      Authorization: `id=${token.user.id} token=${token.token}`,
    },
  };

  const { data: projects } = await axios.get<Project>(
    `${process.env.RETRACED_HOST}/admin/v1/projects`,
    config
  );

  return res.status(200).json({
    data: projects,
    error: null,
  });
};
