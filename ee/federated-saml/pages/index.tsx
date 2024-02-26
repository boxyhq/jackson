import { useEffect } from 'react';
import type { SAMLFederationApp } from '@boxyhq/saml-jackson';
import useSWR from 'swr';
import { useTranslation } from 'next-i18next';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';
import Loading from '@components/Loading';
import EmptyState from '@components/EmptyState';
import { LinkPrimary } from '@components/LinkPrimary';
import { pageLimit, Pagination } from '@components/Pagination';
import usePaginate from '@lib/ui/hooks/usePaginate';
import { LinkOutline } from '@components/LinkOutline';
import PencilIcon from '@heroicons/react/24/outline/PencilIcon';
import router from 'next/router';
import LicenseRequired from '@components/LicenseRequired';
import { errorToast } from '@components/Toaster';
import { Table } from '@components/table/Table';

const AppsList = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  const { t } = useTranslation('common');
  const { paginate, setPaginate, pageTokenMap, setPageTokenMap } = usePaginate();

  let getAppsUrl = `/api/admin/federated-saml?pageOffset=${paginate.offset}&pageLimit=${pageLimit}`;

  // Use the (next)pageToken mapped to the previous page offset to get the current page
  if (paginate.offset > 0 && pageTokenMap[paginate.offset - pageLimit]) {
    getAppsUrl += `&pageToken=${pageTokenMap[paginate.offset - pageLimit]}`;
  }

  const { data, error, isLoading } = useSWR<ApiSuccess<SAMLFederationApp[]>, ApiError>(getAppsUrl, fetcher);

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

  const apps = data?.data || [];
  const noApps = apps.length === 0 && paginate.offset === 0;
  const noMoreResults = apps.length === 0 && paginate.offset > 0;

  return (
    <>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('saml_federation_apps')}</h2>
        <div className='flex'>
          <LinkOutline href={'/.well-known/idp-configuration'} target='_blank' className='m-2'>
            {t('idp_configuration')}
          </LinkOutline>
          <LinkPrimary className='m-2' href='/admin/federated-saml/new'>
            {t('new_saml_federation_app')}
          </LinkPrimary>
        </div>
      </div>
      {noApps ? (
        <>
          <EmptyState title={t('no_saml_federation_apps')} href='/admin/federated-saml/new' />
        </>
      ) : (
        <>
          <Table
            noMoreResults={noMoreResults}
            cols={[t('name'), t('tenant'), t('product'), t('actions')]}
            body={apps.map((app) => {
              return {
                id: app.id,
                cells: [
                  {
                    wrap: true,
                    text: app.name,
                  },
                  {
                    wrap: true,
                    text: app.tenant,
                  },
                  {
                    wrap: true,
                    text: app.product,
                  },
                  {
                    actions: [
                      {
                        text: t('edit'),
                        onClick: () => {
                          router.push(`/admin/federated-saml/${app.id}/edit`);
                        },
                        icon: <PencilIcon className='h-5 w-5' />,
                      },
                    ],
                  },
                ],
              };
            })}></Table>

          <Pagination
            itemsCount={apps.length}
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

export default AppsList;
