import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import type { User } from '@boxyhq/saml-jackson';

import EmptyState from '@components/EmptyState';
import DirectoryTab from '@components/dsync/DirectoryTab';
import Badge from '@components/Badge';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';
import useDirectory from '@lib/ui/hooks/useDirectory';
import { Pagination, pageLimit, NoMoreResults } from '@components/Pagination';
import usePaginate from '@lib/ui/hooks/usePaginate';
import { LinkBack } from '@components/LinkBack';

const UsersList: NextPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { paginate, setPaginate } = usePaginate();

  const { directoryId } = router.query as { directoryId: string };

  const { directory, isLoading: isDirectoryLoading, error: directoryError } = useDirectory(directoryId);

  const {
    data: usersData,
    error: usersError,
    isLoading,
  } = useSWR<ApiSuccess<User[]>, ApiError>(
    `/api/admin/directory-sync/${directoryId}/users?offset=${paginate.offset}&limit=${pageLimit}`,
    fetcher
  );

  if (isDirectoryLoading || isLoading) {
    return <Loading />;
  }

  const error = directoryError || usersError;

  if (error) {
    errorToast(error.message);
    return null;
  }

  if (!directory) {
    return null;
  }

  const users = usersData?.data || [];
  const noUsers = users.length === 0 && paginate.offset === 0;
  const noMoreResults = users.length === 0 && paginate.offset > 0;

  return (
    <>
      <LinkBack href='/admin/directory-sync' />
      <h2 className='mt-5 font-bold text-gray-700 md:text-xl'>{directory.name}</h2>
      <div className='w-full'>
        <DirectoryTab directory={directory} activeTab='users' />
        {noUsers ? (
          <EmptyState title={t('no_users_found')} />
        ) : (
          <>
            <div className='my-3 rounded border'>
              <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
                <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                  <tr className='hover:bg-gray-50'>
                    <th scope='col' className='px-6 py-3'>
                      {t('first_name')}
                    </th>
                    <th scope='col' className='px-6 py-3'>
                      {t('last_name')}
                    </th>
                    <th scope='col' className='px-6 py-3'>
                      {t('email')}
                    </th>
                    <th scope='col' className='px-6 py-3'>
                      {t('status')}
                    </th>
                    <th scope='col' className='px-6 py-3'>
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    return (
                      <tr
                        key={user.id}
                        className='border-b bg-white last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600'>
                        <td className='px-6 py-3'>{user.first_name}</td>
                        <td className='px-6 py-3'>{user.last_name}</td>
                        <td className='px-6 py-3'>{user.email}</td>
                        <td className='px-6 py-3'>
                          {user.active ? (
                            <Badge color='success' size='md'>
                              {t('active')}
                            </Badge>
                          ) : (
                            <Badge color='warning' size='md'>
                              {t('suspended')}
                            </Badge>
                          )}
                        </td>
                        <td className='px-6 py-3'>
                          <Link href={`/admin/directory-sync/${directory.id}/users/${user.id}`}>
                            <EyeIcon className='h-5 w-5' />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {noMoreResults && <NoMoreResults colSpan={5} />}
                </tbody>
              </table>
            </div>
            <Pagination
              itemsCount={users.length}
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

export default UsersList;
