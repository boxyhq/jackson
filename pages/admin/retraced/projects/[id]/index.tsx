import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import type { ApiResponse, Project } from 'types';
import ProjectDetails from '@components/retraced/ProjectDetails';
import { fetcher } from '@lib/ui/utils';

const ProjectInfo: NextPage = () => {
  const router = useRouter();

  const { id } = router.query;

  const { data, error } = useSWR<ApiResponse<{ project: Project }>>(
    [`/api/retraced/projects/${id}`],
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  if (!data && !error) {
    return <>Loading...</>;
  }

  if (error) {
    return (
      <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
        {error.info ? JSON.stringify(error.info) : error.status}
      </div>
    );
  }

  const project = data?.data?.project;

  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{project?.name}</h2>
      </div>
      {project && <ProjectDetails project={project} />}
    </div>
  );
};

export default ProjectInfo;
