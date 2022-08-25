import type { AdminToken, Project } from 'types';
import axios from 'axios';

export const sanitizeResponse = (
  projects: Project[]
): Array<{
  projectId: string;
  name: string;
  environmentId: string;
  environmentName: string;
  token: string;
}> => {
  const output: Array<{
    projectId: string;
    name: string;
    environmentId: string;
    environmentName: string;
    token: string;
  }> = [];

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

export async function getToken(): Promise<AdminToken> {
  const body = {
    claims: {
      upstreamToken: 'ADMIN_ROOT_TOKEN',
      email: process.env.NEXTAUTH_ACL,
    },
  };

  const config = {
    headers: {
      Authorization: `token=${process.env.ADMIN_ROOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  const { data: token } = await axios.post<AdminToken>(
    `${process.env.RETRACED_HOST}/admin/v1/user/_login`,
    body,
    config
  );

  return token;
}
