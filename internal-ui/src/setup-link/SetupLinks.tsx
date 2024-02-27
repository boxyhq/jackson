import useSWR from 'swr';
import { useTranslation } from 'next-i18next';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import ClipboardDocumentIcon from '@heroicons/react/24/outline/ClipboardDocumentIcon';

import { fetcher } from '../utils';
import { TableBodyType } from '../shared/Table';
import { pageLimit } from '../shared/Pagination';
import { usePaginate, useRouter } from '../hooks';
import type { SAMLFederationApp, SetupLink, SetupLinkService } from '../types';
import { Loading, Table, EmptyState, Error, Pagination, PageHeader, ButtonPrimary, Badge } from '../shared';

type ExcludeFields = keyof Pick<SAMLFederationApp, 'product'>;

// TODO:
// Apply excludeFields

export const SetupLinks = ({
  urls,
  excludeFields,
  actions,
  service,
}: {
  urls: { getLinks: string };
  excludeFields?: ExcludeFields[];
  actions: { newLink: string };
  service: SetupLinkService;
}) => {
  const { router } = useRouter();
  const { t } = useTranslation('common');
  const { paginate, setPaginate, pageTokenMap } = usePaginate(router!);

  let getLinksUrl = `${urls.getLinks}?offset=${paginate.offset}&limit=${pageLimit}&service=${service}`;

  // For DynamoDB
  if (paginate.offset > 0 && pageTokenMap[paginate.offset - pageLimit]) {
    getLinksUrl += `&pageToken=${pageTokenMap[paginate.offset - pageLimit]}`;
  }

  const { data, isLoading, error } = useSWR<{ data: SetupLink[] }>(getLinksUrl, fetcher);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  if (!data) {
    return null;
  }

  const links = data?.data || [];
  const noLinks = links.length === 0 && paginate.offset === 0;
  const noMoreResults = links.length === 0 && paginate.offset > 0;

  const cols = [
    t('bui-sl-tenant'),
    t('bui-sl-product'),
    t('bui-sl-validity'),
    t('bui-sl-status'),
    t('bui-sl-actions'),
  ];

  const body: TableBodyType[] = links.map((setupLink) => {
    return {
      id: setupLink.setupID,
      cells: [
        {
          wrap: true,
          text: setupLink.tenant,
        },
        {
          wrap: true,
          text: setupLink.product,
        },
        {
          wrap: false,
          text: new Date(setupLink.validTill).toLocaleString(),
        },
        {
          wrap: false,
          element: new Date(setupLink.validTill).toLocaleString() ? (
            <Badge color='primary'>{t('bui-sl-active')}</Badge>
          ) : (
            <Badge color='warning'>{t('bui-sl-expired')}</Badge>
          ),
        },
        {
          actions: [
            {
              text: t('bui-sl-copy'),
              onClick: () => {
                // copyToClipboard(setupLink.url);
                // successToast(t('copied'));
              },
              icon: <ClipboardDocumentIcon className='h-5 w-5' />,
            },
            {
              text: t('bui-sl-view'),
              onClick: () => {
                // showSetupLinkInfo(setupLink);
              },
              icon: <EyeIcon className='h-5 w-5' />,
            },
            {
              text: t('bui-sl-regenerate'),
              onClick: () => {
                // setSelectedSetupLink(setupLink);
                // setShowRegenConfirmModal(true);
                // setShowSetupLinkModal(false);
              },
              icon: <ArrowPathIcon className='h-5 w-5' />,
            },
            {
              destructive: true,
              text: t('bui-sl-delete'),
              onClick: () => {
                // setSelectedSetupLink(setupLink);
                // setShowDelConfirmModal(true);
              },
              icon: <TrashIcon className='h-5 w-5' />,
            },
          ],
        },
      ],
    };
  });

  return (
    <div className='space-y-3'>
      <PageHeader
        title={service === 'dsync' ? t('bui-sl-dsync-title') : t('bui-sl-sso-title')}
        actions={
          <>
            <ButtonPrimary onClick={() => router?.push(actions.newLink)} className='btn-md'>
              {t('bui-sl-new-link')}
            </ButtonPrimary>
          </>
        }
      />
      {noLinks ? (
        <EmptyState title={t('bui-sl-no-links')} description={t('bui-sl-no-links-desc')} />
      ) : (
        <>
          <Table noMoreResults={noMoreResults} cols={cols} body={body} />
          <Pagination
            itemsCount={links.length}
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

// tenant, product, validity, actions
