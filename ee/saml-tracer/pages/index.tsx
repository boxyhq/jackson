import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import usePaginate from '@lib/ui/hooks/usePaginate';
import { fetcher } from '@lib/ui/utils';
import type { ApiSuccess, ApiError } from 'types';
import type { Trace } from '@boxyhq/saml-jackson';
import { pageLimit, Pagination, NoMoreResults } from '@components/Pagination';
import Loading from '@components/Loading';
import { errorToast } from '@components/Toaster';
import LicenseRequired from '@components/LicenseRequired';
import { useTranslation } from 'next-i18next';
import EmptyState from '@components/EmptyState';
import { IconButton } from '@components/IconButton';
import { ViewfinderCircleIcon } from '@heroicons/react/24/outline';

const SAMLTraceViewer: NextPage = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { paginate, setPaginate } = usePaginate();

  const { data, error, isLoading } = useSWR<ApiSuccess<Trace[]>, ApiError>(
    `/api/admin/saml-tracer/?offset=${paginate.offset}&limit=${pageLimit}`,
    fetcher
  );

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  const traces = data?.data || [];
  const noTraces = traces.length === 0 && paginate.offset === 0;
  const noMoreResults = traces.length === 0 && paginate.offset > 0;

  return (
    <LicenseRequired>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('saml_tracer')}</h2>
      </div>
      {noTraces ? (
        <>
          <EmptyState title={t('no_saml_traces_found')} />
        </>
      ) : (
        <>
          <div className='rounder border'>
            <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
              <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                <tr className='hover:bg-gray-50'>
                  <th className='px-6 py-3'>Trace Id</th>
                  <th className='px-6 py-3'>Timestamp</th>
                  <th className='px-6 py-3'>Phase</th>
                  <th className='px-6 py-3'>Failure</th>
                </tr>
              </thead>
              <tbody>
                {traces?.map(({ traceId, timestamp, context, error }) => {
                  return (
                    <tr
                      key={traceId}
                      className='border-b bg-white last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800'>
                      <td className='px-6 py-3'>{timestamp}</td>
                      <td className='px-6 py-3'>{context?.samlResponse ? 'Response' : 'Request'}</td>
                      <td className='px-6'>{error}</td>
                      <td className='px-6'>
                        <span className='inline-flex items-baseline'>
                          <IconButton
                            tooltip={t('view')}
                            Icon={ViewfinderCircleIcon}
                            className='hover:text-green-400'
                            onClick={() => {
                              router.push(`/admin/saml-tracer/${traceId}/view`);
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
            <Pagination
              itemsCount={traces.length}
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
          </div>
        </>
      )}
    </LicenseRequired>
  );
};

export default SAMLTraceViewer;
