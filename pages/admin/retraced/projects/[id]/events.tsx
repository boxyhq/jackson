import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useProject, useGroups } from '@lib/ui/retraced';
import Loading from '@components/Loading';
import ErrorMessage from '@components/Error';
import { LinkBack } from '@components/LinkBack';
import { Select } from 'react-daisyui';
import { retracedOptions } from '@lib/env';

const LogsViewer = dynamic(() => import('@components/retraced/LogsViewer'), {
  ssr: false,
});

export interface Props {
  host?: string;
}

const Events: NextPage<Props> = ({ host }: Props) => {
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

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <ErrorMessage />;
  }

  const displayLogsViewer = project && environment && group;

  return (
    <div>
      <LinkBack href='/admin/retraced/projects' />
      <div className='mb-2 mt-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{project?.name}</h2>
      </div>
      <div className='flex space-x-2'>
        <div className='form-control max-w-xs'>
          <label className='label pl-0'>
            <span className='label-text'>Environment</span>
          </label>
          {project ? (
            <Select
              value={environment}
              onChange={(event) => {
                setEnvironment(event.target.value);
                setGroup('');
              }}>
              {project!.environments.map((environment) => (
                <option key={environment.id} value={environment.id}>
                  {environment.name}
                </option>
              ))}
            </Select>
          ) : null}
        </div>
        <div className='form-control max-w-xs'>
          <label className='label pl-0'>
            <span className='label-text'>Group (Tenant)</span>
          </label>
          {groups ? (
            <Select
              value={group}
              onChange={(event) => {
                setGroup(event.target.value);
              }}>
              {groups!.map((group) => (
                <option key={group.group_id} value={group.group_id}>
                  {group.name ? group.name : group.group_id}
                </option>
              ))}
            </Select>
          ) : null}
        </div>
      </div>
      <div className='flex'>
        {displayLogsViewer && (
          <LogsViewer project={project} environmentId={environment} groupId={group} host={host!} />
        )}
      </div>
    </div>
  );
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      host: retracedOptions.externalUrl,
    },
  };
}

export default Events;
