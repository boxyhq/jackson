import useSWR from 'swr';

import type { ApiError, ApiSuccess } from 'types';
import type { Project, Group } from 'types/retraced';
import { fetcher } from '@lib/ui/utils';

export const useProject = (projectId: string) => {
  const { data, error, isLoading } = useSWR<ApiSuccess<{ project: Project }>, ApiError>(
    `/api/admin/retraced/projects/${projectId}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    project: data?.data.project,
    isLoading,
    isError: error,
  };
};

export const useProjects = (offset: number, limit: number) => {
  const { data, error, isLoading } = useSWR<ApiSuccess<{ projects: Project[] }>, ApiError>(
    `/api/admin/retraced/projects?offset=${offset}&limit=${limit}`,
    fetcher
  );

  return {
    projects: data?.data?.projects || [],
    isLoading,
    isError: error,
  };
};

export const useGroups = (projectId: string, environmentId: string) => {
  const { data, error, isLoading } = useSWR<ApiSuccess<{ groups: Group[] }>, ApiError>(
    environmentId ? `/api/admin/retraced/projects/${projectId}/groups?environmentId=${environmentId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    groups: data?.data?.groups,
    isLoading,
    isError: error,
  };
};
