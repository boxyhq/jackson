import useSWR from 'swr';
import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import ClipboardDocumentIcon from '@heroicons/react/24/outline/ClipboardDocumentIcon';

import { copyToClipboard, fetcher } from '../utils';
import { TableBodyType } from '../shared/Table';
import { pageLimit } from '../shared/Pagination';
import { usePaginate, useRouter } from '../hooks';
import type { SAMLFederationApp, SetupLink, SetupLinkService } from '../types';
import {
  Loading,
  Table,
  EmptyState,
  Error,
  Pagination,
  PageHeader,
  ButtonPrimary,
  Badge,
  ConfirmationModal,
} from '../shared';
import { SetupLinkInfoModal } from './SetupLinkInfoModal';

type ExcludeFields = keyof Pick<SAMLFederationApp, 'product'>;

// TODO:
// Apply excludeFields
// Test pagination with mutate

export const SetupLinks = ({
  urls,
  excludeFields,
  actions,
  service,
  onCopy,
}: {
  urls: { getLinks: string; deleteLink: string };
  excludeFields?: ExcludeFields[];
  actions: { newLink: string };
  service: SetupLinkService;
  onCopy: (setupLink: SetupLink) => void;
}) => {
  const { router } = useRouter();
  const { t } = useTranslation('common');
  const [showDelModal, setDelModal] = useState(false);
  const [showSetupLink, setShowSetupLink] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [setupLink, setSetupLink] = useState<SetupLink | null>(null);
  const { paginate, setPaginate, pageTokenMap } = usePaginate(router!);

  let getLinksUrl = `${urls.getLinks}?offset=${paginate.offset}&limit=${pageLimit}&service=${service}`;

  // For DynamoDB
  if (paginate.offset > 0 && pageTokenMap[paginate.offset - pageLimit]) {
    getLinksUrl += `&pageToken=${pageTokenMap[paginate.offset - pageLimit]}`;
  }

  const { data, isLoading, error, mutate } = useSWR<{ data: SetupLink[] }>(getLinksUrl, fetcher);

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
                copyToClipboard(setupLink.url);
                onCopy(setupLink);
              },
              icon: <ClipboardDocumentIcon className='h-5 w-5' />,
            },
            {
              text: t('bui-sl-view'),
              onClick: () => {
                setSetupLink(setupLink);
                setShowSetupLink(true);
              },
              icon: <EyeIcon className='h-5 w-5' />,
            },
            {
              text: t('bui-sl-regenerate'),
              onClick: () => {
                setSetupLink(setupLink);
                setShowRegenModal(true);
              },
              icon: <ArrowPathIcon className='h-5 w-5' />,
            },
            {
              destructive: true,
              text: t('bui-sl-delete'),
              onClick: () => {
                setSetupLink(setupLink);
                setDelModal(true);
              },
              icon: <TrashIcon className='h-5 w-5' />,
            },
          ],
        },
      ],
    };
  });

  // Delete setup link
  const deleteSetupLink = async () => {
    if (!setupLink) {
      return;
    }

    await fetch(`${urls.deleteLink}?setupID=${setupLink.setupID}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    setDelModal(false);
    setSetupLink(null);
    mutate();
  };

  // Regenerate a setup link
  const regenerateSetupLink = async () => {
    if (!setupLink) {
      return;
    }

    // const { tenant, product, service } = selectedSetupLink;

    const rawResponse = await fetch('/api/admin/setup-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...setupLink, regenerate: true }),
    });

    const response = await rawResponse.json();

    // Add callback

    // if ('error' in response) {
    //   errorToast(response.error.message);
    //   return;
    // }

    // if ('data' in response) {
    //   setShowRegenConfirmModal(false);
    //   await mutate();
    //   showSetupLinkInfo(response.data);
    //   successToast(t('link_regenerated'));
    // }
  };

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
          <ConfirmationModal
            title={t('bui-sl-delete-link-title')}
            description={t('bui-sl-delete-link-desc')}
            visible={showDelModal}
            onConfirm={() => deleteSetupLink()}
            onCancel={() => {
              setDelModal(false);
              setSetupLink(null);
            }}
          />
          <ConfirmationModal
            title={t('bui-sl-regen-link-title')}
            description={t('bui-sl-regen-link-desc')}
            visible={showRegenModal}
            onConfirm={() => regenerateSetupLink()}
            onCancel={() => {
              setShowRegenModal(false);
              setSetupLink(null);
            }}
            actionButtonText={t('bui-sl-regenerate')!}
          />
          {setupLink && (
            <SetupLinkInfoModal
              setupLink={setupLink}
              visible={showSetupLink}
              onClose={() => {
                setShowSetupLink(false);
                setSetupLink(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};
