import useSWR from 'swr';
import { SAMLFederationApp } from '@boxyhq/saml-jackson';
import fetcher from '../utils/fetcher';
import { EditBranding } from './EditBranding';
import { Edit } from './Edit';
import { EditAttributesMapping } from './EditAttributesMapping';
import { DeleteCard, Loading } from '../shared';
import { useTranslation } from 'next-i18next';

export const EditFederatedSAMLApp = ({
  urls,
  onError,
  onSuccess,
  excludeFields,
}: {
  urls: { get: string; patch: string };
  onSuccess?: (data: SAMLFederationApp) => void;
  onError?: (error: Error) => void;
  excludeFields?: 'product'[];
}) => {
  const { t } = useTranslation('common');

  // TODO: mutate after patching
  const { data, isLoading, error, mutate } = useSWR<{ data: SAMLFederationApp }>(urls.get, fetcher);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    onError?.(error);
    return;
  }

  if (!data) {
    return null;
  }

  const app = data?.data;

  return (
    <div className='flex flex-col gap-6'>
      <Edit app={app} urls={urls} onError={onError} onSuccess={onSuccess} excludeFields={excludeFields} />
      <EditAttributesMapping app={app} urls={{ patch: urls.patch }} onError={onError} onSuccess={onSuccess} />
      <EditBranding app={app} urls={{ patch: urls.patch }} onError={onError} onSuccess={onSuccess} />
      <DeleteCard
        title={t('bui-fs-delete-app-title')}
        description={t('bui-fs-delete-app-desc')}
        buttonLabel={t('bui-fs-delete-app-button')}
      />
    </div>
  );
};
