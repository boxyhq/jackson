import type { NextPage } from 'next';
import { useRouter } from 'next/router';

import ProjectDetails from '@components/retraced/ProjectDetails';
import { useProject } from '@lib/retraced';
import Loading from '@components/Loading';
import ErrorMessage from '@components/Error';

const ProjectInfo: NextPage = () => {
  const router = useRouter();

  const { id: projectId } = router.query;

  const { project, isError, isLoading } = useProject(projectId as string);

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <ErrorMessage />;
  }

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
