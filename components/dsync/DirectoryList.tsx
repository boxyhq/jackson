import EmptyState from '@components/EmptyState';
import Paginate from '@components/Paginate';
import { CircleStackIcon, LinkIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Directory } from '@lib/jackson';
import { useTranslation } from 'next-i18next';
import { LinkPrimary } from '@components/LinkPrimary';
import { IconButton } from '@components/IconButton';
import { useRouter } from 'next/router';

type DirectoryListProps = {
  directories: Directory[];
  pageOffset: number;
  pageLimit: number;
  providers: any;
  token?: string;
};

const DirectoryList = ({ directories, pageOffset, pageLimit, providers, token }: DirectoryListProps) => {
  const { t } = useTranslation('common');
  const router = useRouter();

  const displayTenantProduct = token ? false : true;

  return (
    <>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('directory_sync')}</h2>
        <div className='flex gap-2'>
          <LinkPrimary
            Icon={PlusIcon}
            href={token ? `/setup/${token}/directory-sync/new` : '/admin/directory-sync/new'}>
            {t('new_directory')}
          </LinkPrimary>
          {!token && (
            <LinkPrimary Icon={LinkIcon} href={`/admin/directory-sync/setup-link/new`}>
              {t('new_setup_link')}
            </LinkPrimary>
          )}
        </div>
      </div>
      {directories.length === 0 && pageOffset === 0 ? (
        <EmptyState
          title={t('no_directories_found')}
          href={token ? `/setup/${token}/directory-sync/new` : '/admin/directory-sync/new'}
        />
      ) : (
        <div className='rounder border'>
          <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
            <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
              <tr>
                <th scope='col' className='px-6 py-3'>
                  {t('name')}
                </th>
                {displayTenantProduct && (
                  <>
                    <th scope='col' className='px-6 py-3'>
                      {t('tenant')}
                    </th>
                    <th scope='col' className='px-6 py-3'>
                      {t('product')}
                    </th>
                  </>
                )}
                <th scope='col' className='px-6 py-3'>
                  {t('type')}
                </th>
                <th scope='col' className='px-6 py-3'>
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {directories &&
                directories.map((directory) => {
                  return (
                    <tr
                      key={directory.id}
                      className='border-b bg-white last:border-b-0 dark:border-gray-700 dark:bg-gray-800'>
                      <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                        {directory.name}
                      </td>
                      {displayTenantProduct && (
                        <>
                          <td className='px-6'>{directory.tenant}</td>
                          <td className='px-6'>{directory.product}</td>
                        </>
                      )}
                      <td className='px-6'>{providers[directory.type]}</td>
                      <td className='px-6'>
                        <span className='inline-flex items-baseline'>
                          <IconButton
                            tooltip={t('view')}
                            Icon={CircleStackIcon}
                            className='mr-3 hover:text-green-200'
                            onClick={() => {
                              router.push(
                                token
                                  ? `/setup/${token}/directory-sync/${directory.id}`
                                  : `/admin/directory-sync/${directory.id}`
                              );
                            }}
                          />
                          <IconButton
                            tooltip={t('edit')}
                            Icon={PencilIcon}
                            className='hover:text-green-200'
                            onClick={() => {
                              router.push(
                                token
                                  ? `/setup/${token}/directory-sync/${directory.id}/edit`
                                  : `/admin/directory-sync/${directory.id}/edit`
                              );
                            }}
                          />
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <Paginate
            pageOffset={pageOffset}
            pageLimit={pageLimit}
            itemsCount={directories ? directories.length : 0}
            path={token ? `/setup/${token}/directory-sync?` : `/admin/directory-sync?`}
          />
        </div>
      )}
    </>
  );
};

export default DirectoryList;
