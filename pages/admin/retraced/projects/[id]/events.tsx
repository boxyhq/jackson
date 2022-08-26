import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { useProject, useGroups } from '@lib/retraced';
import Loading from '@components/Loading';
import ErrorMessage from '@components/Error';

const LogsViewer = dynamic(() => import('@components/retraced/LogsViewer'), {
  ssr: false,
});

const Events: NextPage = () => {
  const router = useRouter();

  const [environment, setEnvironment] = useState('');
  const [group, setGroup] = useState('');

  const projectId = router.query.id as string;

  const { project, isLoading, isError } = useProject(projectId);
  const { groups } = useGroups(projectId, environment);

  // Set the environment
  useEffect(() => {
    if (project) {
      setEnvironment(project.environments[0].id);
    }
  }, [project]);

  // Set the group
  useEffect(() => {
    if (groups && groups.length > 0) {
      setGroup(groups[0].group_id);
    }
  }, [groups]);

  const displayLogsViewer = project && environment && group;

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
      <div className='flex space-x-2'>
        <div className='form-control max-w-xs'>
          <label className='label pl-0'>
            <span className='label-text'>Environments</span>
          </label>
          <select
            className='select select-bordered'
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setEnvironment(e.target.value);
            }}>
            {project?.environments.map((environment) => (
              <option key={environment.id} value={environment.id}>
                {environment.name}
              </option>
            ))}
          </select>
        </div>
        <div className='form-control w-full max-w-xs'>
          <label className='label pl-0'>
            <span className='label-text'>Tenants</span>
          </label>
          <select
            className='select select-bordered'
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setGroup(e.target.value);
            }}>
            {groups &&
              groups.map((group) => (
                <option key={group.group_id} value={group.group_id}>
                  {group.name ? group.name : group.group_id}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div className='flex'>
        {displayLogsViewer && <LogsViewer project={project} environmentId={environment} groupId={group} />}
      </div>
    </div>
  );
};

export default Events;
