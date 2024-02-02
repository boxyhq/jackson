import { useEffect } from 'react';
import type { SecurityLogsConfig } from '@boxyhq/saml-jackson';
import useSWR from 'swr';
import { useTranslation } from 'next-i18next';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';
import Loading from '@components/Loading';
import EmptyState from '@components/EmptyState';
import { LinkPrimary } from '@components/LinkPrimary';
import { pageLimit, Pagination, NoMoreResults } from '@components/Pagination';
import usePaginate from '@lib/ui/hooks/usePaginate';
import { IconButton } from '@components/IconButton';
import PencilIcon from '@heroicons/react/24/outline/PencilIcon';
import PlusIcon from '@heroicons/react/24/outline/PlusIcon';
import router from 'next/router';
import LicenseRequired from '@components/LicenseRequired';
import { errorToast } from '@components/Toaster';
import { getDisplayTypeFromSinkType } from '@lib/sinkConfigMap';

const ConfigList = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  const { t } = useTranslation('common');
  const { paginate, setPaginate, pageTokenMap, setPageTokenMap } = usePaginate();

  let getAppsUrl = `/api/admin/security-logs-config?offset=${paginate.offset}&limit=${pageLimit}`;

  // Use the (next)pageToken mapped to the previous page offset to get the current page
  if (paginate.offset > 0 && pageTokenMap[paginate.offset - pageLimit]) {
    getAppsUrl += `&pageToken=${pageTokenMap[paginate.offset - pageLimit]}`;
  }

  const { data, error, isLoading } = useSWR<ApiSuccess<SecurityLogsConfig[]>, ApiError>(getAppsUrl, fetcher);

  const nextPageToken = data?.pageToken;

  // store the nextPageToken against the pageOffset
  useEffect(() => {
    if (nextPageToken) {
      setPageTokenMap((tokenMap) => ({ ...tokenMap, [paginate.offset]: nextPageToken }));
    }
  }, [nextPageToken, paginate.offset]);

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return;
  }

  const configs = data?.data || [];
  const noConfigs = configs.length === 0 && paginate.offset === 0;
  const noMoreResults = configs.length === 0 && paginate.offset > 0;

  return (
    <>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('security_logs_configs')}</h2>
        <div className='flex'>
          <LinkPrimary className='m-2' Icon={PlusIcon} href='/admin/settings/security-logs/new'>
            {t('new_security_logs_config')}
          </LinkPrimary>
        </div>
      </div>
      {noConfigs ? (
        <>
          <EmptyState title={t('no_security_logs_config')} href='/admin/settings/security-logs/new' />
        </>
      ) : (
        <>
          <div className='rounder border'>
            <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
              <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                <tr className='hover:bg-gray-50'>
                  <th scope='col' className='px-6 py-3'>
                    {t('name')}
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    {t('type')}
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    {t('tenant')}
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {configs &&
                  configs.map((config) => {
                    return (
                      <tr
                        key={config.id}
                        className='border-b bg-white last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800'>
                        <td className='px-6'>{config.name}</td>
                        <td className='px-6'>{getDisplayTypeFromSinkType(config.type)}</td>
                        <td className='px-6 py-3'>{config.tenant}</td>
                        <td className='px-6'>
                          <span className='inline-flex items-baseline'>
                            <IconButton
                              tooltip={t('edit')}
                              Icon={PencilIcon}
                              className='hover:text-green-400'
                              onClick={() => {
                                router.push(`/admin/settings/security-logs/${config.id}/edit`);
                              }}
                            />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                {noMoreResults && <NoMoreResults colSpan={4} />}
              </tbody>
            </table>
          </div>
          <Pagination
            itemsCount={configs.length}
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
    </>
  );
};

export default ConfigList;
