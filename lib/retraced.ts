import axios from 'axios';
import useSWR from 'swr';

import type { AdminToken, Project, ApiResponse, Group } from 'types';
import { fetcher } from '@lib/ui/utils';
import env from './env';

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

export const getToken = async (): Promise<AdminToken> => {
  const { data } = await axios.post<{ adminToken: AdminToken }>(
    `${env.retraced.host}/admin/v1/user/_login`,
    {
      claims: {
        upstreamToken: 'ADMIN_ROOT_TOKEN',
        email: process.env.NEXTAUTH_ACL,
      },
    },
    {
      headers: {
        Authorization: `token=${process.env.ADMIN_ROOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return data.adminToken;
};

export const useProject = (projectId: string) => {
  const { data, error } = useSWR<ApiResponse<{ project: Project }>>(
    `/api/admin/retraced/projects/${projectId}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    project: data?.data?.project,
    isLoading: !error && !data,
    isError: error,
  };
};

export const useProjects = () => {
  const { data, error } = useSWR<ApiResponse<{ projects: Project[] }>>(
    '/api/admin/retraced/projects',
    fetcher
  );

  return {
    projects: data?.data?.projects,
    isLoading: !error && !data,
    isError: error,
  };
};

export const useGroups = (projectId: string, environmentId: string) => {
  const { data, error } = useSWR<ApiResponse<{ groups: Group[] }>>(
    environmentId ? `/api/admin/retraced/projects/${projectId}/groups?environmentId=${environmentId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    groups: data?.data?.groups,
    isLoading: !error && !data,
    isError: error,
  };
};
