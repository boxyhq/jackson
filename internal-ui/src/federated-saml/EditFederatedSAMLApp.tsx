import useSWR from 'swr';
import { SAMLFederationApp } from '@boxyhq/saml-jackson';
import fetcher from '../utils/fetcher';
import { EditBranding } from './EditBranding';
import { Edit } from './Edit';
import { EditAttributesMapping } from './EditAttributesMapping';
import { DeleteCard, Loading, DeleteConfirmationModal } from '../shared';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { defaultHeaders } from '../utils/request';

// TODO: mutate after patching

export const EditFederatedSAMLApp = ({
  urls,
  onError,
  onUpdate,
  onDelete,
  excludeFields,
}: {
  urls: { get: string; patch: string; delete: string };
  onUpdate?: (data: SAMLFederationApp) => void;
  onError?: (error: Error) => void;
  onDelete?: () => void;
  excludeFields?: 'product'[];
}) => {
  const { t } = useTranslation('common');
  const [delModalVisible, setDelModalVisible] = useState(false);

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

  const deleteApp = async () => {
    try {
      await fetch(urls.delete, { method: 'DELETE', headers: defaultHeaders });
      setDelModalVisible(false);
      onDelete?.();
    } catch (error: any) {
      onError?.(error);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <Edit app={app} urls={urls} onError={onError} onUpdate={onUpdate} excludeFields={excludeFields} />
      <EditAttributesMapping app={app} urls={{ patch: urls.patch }} onError={onError} onUpdate={onUpdate} />
      <EditBranding app={app} urls={{ patch: urls.patch }} onError={onError} onUpdate={onUpdate} />
      <DeleteCard
        title={t('bui-fs-delete-app-title')}
        description={t('bui-fs-delete-app-desc')}
        buttonLabel={t('bui-shared-delete')}
        onClick={() => setDelModalVisible(true)}
      />
      <DeleteConfirmationModal
        title={t('bui-fs-delete-app-title')}
        description={t('bui-fs-delete-app-desc')}
        visible={delModalVisible}
        onConfirm={() => deleteApp()}
        onCancel={() => setDelModalVisible(false)}
      />
    </div>
  );
};
