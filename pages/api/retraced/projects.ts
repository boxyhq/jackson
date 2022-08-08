import axios from 'axios';
import { Token } from '../../../interfaces/token';
import { NextApiRequest, NextApiResponse } from 'next';
import { NewProject } from 'interfaces/project';

const createProject = async (id: string, token: string, name: string): Promise<NewProject> => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      name,
    });

    const config = {
      method: 'post',
      url: `${process.env.RETRACED_HOST}/admin/v1/project`,
      headers: {
        Authorization: `id=${id} token=${token}`,
        'Content-Type': 'application/json',
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        resolve(response.data);
      })
      .catch(function (error) {
        reject(error);
      });
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getProjects = async (id: string, token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const config = {
      method: 'get',
      url: `${process.env.RETRACED_HOST}/admin/v1/projects`,
      headers: {
        Authorization: `id=${id} token=${token}`,
      },
    };

    axios(config)
      .then(function (response) {
        resolve(response.data);
      })
      .catch(function (error) {
        reject(error);
      });
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sanitizeResponse = (projects: any): Array<any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output: Array<any> = [];
  for (let i = 0; i < projects.length; i++) {
    const row = projects[i];
    for (let j = 0; j < projects[i].environments.length; j++) {
      output.push({
        projectId: row.id,
        name: row.name,
        environmentId: projects[i].environments[j].id,
        environmentName: projects[i].environments[j].name,
        token: projects[i].tokens.filter((t) => t.environment_id == projects[i].environments[j].id)[0].token,
      });
    }
  }
  return output;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken();
  if (req.method === 'POST') {
    const output = await createProject(token.id, token.token, req.body.name);
    res.status(200).json(output);
  } else {
    const projects = await getProjects(token.id, token.token);
    res.status(200).json(sanitizeResponse(projects.projects));
  }
}

export async function getToken(): Promise<Token> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      claims: {
        upstreamToken: 'ADMIN_ROOT_TOKEN',
        email: process.env.NEXTAUTH_ACL,
      },
    });

    const config = {
      method: 'post',
      url: `${process.env.RETRACED_HOST}/admin/v1/user/_login`,
      headers: {
        Authorization: `token=${process.env.ADMIN_ROOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: data,
    };

    axios(config)
      .then(async function (response) {
        resolve(response.data.adminToken);
      })
      .catch(function (error) {
        reject(error);
      });
  });
}
