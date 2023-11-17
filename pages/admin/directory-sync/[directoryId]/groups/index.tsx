import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import Link from 'next/link';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import type { Group } from '@npm/src/index';

import EmptyState from '@components/EmptyState';
import DirectoryTab from '@components/dsync/DirectoryTab';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';
import useDirectory from '@lib/ui/hooks/useDirectory';
import { Pagination, pageLimit, NoMoreResults } from '@components/Pagination';
import usePaginate from '@lib/ui/hooks/usePaginate';
import { LinkBack } from '@components/LinkBack';

const GroupsList: NextPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { paginate, setPaginate } = usePaginate();

  const { directoryId } = router.query as { directoryId: string };

  const { directory, isLoading: isDirectoryLoading, error: directoryError } = useDirectory(directoryId);

  const {
    data: groupsData,
    error: groupsError,
    isLoading,
  } = useSWR<ApiSuccess<Group[]>, ApiError>(
    `/api/admin/directory-sync/${directoryId}/groups?offset=${paginate.offset}&limit=${pageLimit}`,
    fetcher
  );

  if (isDirectoryLoading || isLoading) {
    return <Loading />;
  }

  const error = directoryError || groupsError;

  if (error) {
    errorToast(error.message);
    return null;
  }

  if (!directory) {
    return null;
  }

  const groups = groupsData?.data || [];
  const noGroups = groups.length === 0 && paginate.offset === 0;
  const noMoreResults = groups.length === 0 && paginate.offset > 0;

  return (
    <>
      <LinkBack href='/admin/directory-sync' />
      <h2 className='mt-5 font-bold text-gray-700 md:text-xl'>{directory.name}</h2>
      <div className='w-full'>
        <DirectoryTab directory={directory} activeTab='groups' />
        {noGroups ? (
          <EmptyState title={t('no_groups_found')} />
        ) : (
          <>
            <div className='my-3 rounded border'>
              <table className='w-full table-fixed text-left text-sm text-gray-500 dark:text-gray-400'>
                <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                  <tr className='hover:bg-gray-50'>
                    <th scope='col' className='w-5/6 px-6 py-3'>
                      {t('name')}
                    </th>
                    <th scope='col' className='w-1/6 px-6 py-3'>
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => {
                    return (
                      <tr
                        key={group.id}
                        className='border-b bg-white last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600'>
                        <td className='px-6 py-3'>{group.name}</td>
                        <td className='px-6 py-3'>
                          <Link href={`/admin/directory-sync/${directory.id}/groups/${group.id}`}>
                            <EyeIcon className='h-5 w-5' />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {noMoreResults && <NoMoreResults colSpan={2} />}
                </tbody>
              </table>
            </div>
            <Pagination
              itemsCount={groups.length}
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
    </>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { locale } = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default GroupsList;
