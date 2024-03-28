import type { NextPage } from 'next';
import DocumentMagnifyingGlassIcon from '@heroicons/react/24/outline/DocumentMagnifyingGlassIcon';
import WrenchScrewdriverIcon from '@heroicons/react/24/outline/WrenchScrewdriverIcon';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useProjects } from '@lib/ui/retraced';
import { useTranslation } from 'next-i18next';
import router from 'next/router';
import { EmptyState, Pagination, pageLimit, Table, LinkPrimary, Loading } from '@boxyhq/internal-ui';
import usePaginate from '@lib/ui/hooks/usePaginate';
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
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('projects')}</h2>
        <LinkPrimary href={'/admin/retraced/projects/new'}>{t('new_project')}</LinkPrimary>
      </div>
      {noProjects ? (
        <EmptyState title={t('no_projects_found')} />
      ) : (
        <>
          <Table
            noMoreResults={noMoreResults}
            cols={[t('bui-shared-name'), t('id'), t('created_at'), t('bui-shared-actions')]}
            body={projects.map((project) => {
              return {
                id: project.id,
                cells: [
                  {
                    wrap: true,
                    text: project.name,
                  },
                  {
                    wrap: true,
                    text: project.id,
                  },
                  {
                    wrap: true,
                    text: new Date(project.created).toLocaleString(),
                  },
                  {
                    actions: [
                      {
                        text: t('configuration'),
                        onClick: () => {
                          router.push(`/admin/retraced/projects/${project.id}`);
                        },
                        icon: <WrenchScrewdriverIcon className='h-5 w-5' />,
                      },
                      {
                        text: t('view_events'),
                        onClick: () => {
                          router.push(`/admin/retraced/projects/${project.id}/events`);
                        },
                        icon: <DocumentMagnifyingGlassIcon className='h-5 w-5' />,
                      },
                    ],
                  },
                ],
              };
            })}></Table>

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
