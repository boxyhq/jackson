import type { NextPage } from 'next';
import { DocumentMagnifyingGlassIcon, PlusIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import EmptyState from '@components/EmptyState';
import { useProjects } from '@lib/ui/retraced';
import Loading from '@components/Loading';
import { IconButton } from '@components/IconButton';
import { useTranslation } from 'next-i18next';
import router from 'next/router';
import { Pagination, pageLimit, NoMoreResults } from '@components/Pagination';
import usePaginate from '@lib/ui/hooks/usePaginate';
import { LinkPrimary } from '@components/LinkPrimary';
import { errorToast } from '@components/Toaster';

const ProjectList: NextPage = () => {
  const { t } = useTranslation('common');
  const { paginate, setPaginate } = usePaginate();
  const { projects, isError, isLoading } = useProjects(paginate.offset, pageLimit);

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    errorToast(isError?.message || t('unable_to_fetch_projects'));
    return null;
  }

  const noProjects = projects.length === 0 && paginate.offset === 0;
  const noMoreResults = projects.length === 0 && paginate.offset > 0;

  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>Projects</h2>
        <LinkPrimary Icon={PlusIcon} href={'/admin/retraced/projects/new'}>
          {t('new_project')}
        </LinkPrimary>
      </div>
      {noProjects ? (
        <EmptyState title={t('no_projects_found')} href='/admin/retraced/projects/new' />
      ) : (
        <>
          <div className='rounder border'>
            <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
              <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                <tr>
                  <th scope='col' className='px-6 py-3'>
                    Name
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    Id
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    Created At
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects?.map((project) => (
                  <tr key={project.id} className='border-b bg-white dark:border-gray-700 dark:bg-gray-800'>
                    <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                      {project.name}
                    </td>
                    <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                      {project.id}
                    </td>
                    <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                      {project.created}
                    </td>
                    <td className='px-6 py-3'>
                      <span className='inline-flex items-baseline'>
                        <IconButton
                          tooltip={t('configuration')}
                          Icon={WrenchScrewdriverIcon}
                          className='mr-3 hover:text-green-400'
                          onClick={() => {
                            router.push(`/admin/retraced/projects/${project.id}`);
                          }}
                        />
                        <IconButton
                          tooltip={t('view_events')}
                          Icon={DocumentMagnifyingGlassIcon}
                          className='mr-3 hover:text-green-400'
                          onClick={() => {
                            router.push(`/admin/retraced/projects/${project.id}/events`);
                          }}
                        />
                      </span>
                    </td>
                  </tr>
                ))}
                {noMoreResults && <NoMoreResults colSpan={4} />}
              </tbody>
            </table>
          </div>
          <Pagination
            itemsCount={projects.length}
            offset={paginate.offset}
            onPrevClick={() => {
              setPaginate({
                offset: paginate.offset - pageLimit,
              });
            }}
            onNextClick={() => {
              setPaginate({
                offset: paginate.offset + pageLimit,
              });
            }}
          />
        </>
      )}
    </div>
  );
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default ProjectList;
