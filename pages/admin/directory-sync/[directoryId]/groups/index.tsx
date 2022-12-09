import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import Link from 'next/link';
import { EyeIcon } from '@heroicons/react/24/outline';

import jackson from '@lib/jackson';
import EmptyState from '@components/EmptyState';
import Paginate from '@components/Paginate';
import DirectoryTab from '@components/dsync/DirectoryTab';
import { inferSSRProps } from '@lib/inferSSRProps';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const GroupsList: NextPage<inferSSRProps<typeof getServerSideProps>> = ({
  directory,
  groups,
  pageOffset,
  pageLimit,
}) => {
  const { t } = useTranslation('common');
  return (
    <>
      <h2 className='font-bold text-gray-700 md:text-xl'>{directory.name}</h2>
      <div className='w-full md:w-3/4'>
        <DirectoryTab directory={directory} activeTab='groups' />
        {groups?.length === 0 && pageOffset === 0 ? (
          <EmptyState title='No groups found' />
        ) : (
          <div className='my-3 rounded border'>
            <table className='w-full table-fixed text-left text-sm text-gray-500 dark:text-gray-400'>
              <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                <tr>
                  <th scope='col' className='w-5/6 px-6 py-3'>
                    {t('name')}
                  </th>
                  <th scope='col' className='w-1/6 px-6 py-3'>
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups &&
                  groups.map((group) => {
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
              </tbody>
            </table>
            <Paginate
              pageOffset={pageOffset}
              pageLimit={pageLimit}
              itemsCount={groups ? groups.length : 0}
              path={`/admin/directory-sync/${directory.id}/groups?`}
            />
          </div>
        )}
      </div>
    </>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { directoryId, offset = 0 } = context.query;
  const { directorySyncController } = await jackson();
  const { locale }: GetServerSidePropsContext = context;

  const pageOffset = parseInt(offset as string);
  const pageLimit = 25;

  const { data: directory } = await directorySyncController.directories.get(directoryId as string);

  if (!directory) {
    return {
      notFound: true,
    };
  }

  const { data: groups } = await directorySyncController.groups
    .setTenantAndProduct(directory.tenant, directory.product)
    .list({ pageOffset, pageLimit });

  return {
    props: {
      directory,
      groups,
      pageOffset,
      pageLimit,
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default GroupsList;
