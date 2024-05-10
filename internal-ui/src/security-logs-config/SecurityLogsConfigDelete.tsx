import { useState } from 'react';
import { useTranslation } from 'next-i18next';

import { ButtonDanger, ConfirmationModal } from '../shared';
import { useRouter } from '../hooks';
import { ApiResponse } from '../types';

export const SecurityLogsConfigDelete = ({
  id,
  urls,
  onError,
  onSuccess,
}: {
  id: string;
  urls: { deleteById: (id: string) => string; listConfigs: string };
  onError: (string) => void;
  onSuccess: (string) => void;
}) => {
  const { t } = useTranslation('common');
  const { router } = useRouter();

  const [delModalVisible, setDelModalVisible] = useState(false);

  const deleteApp = async () => {
    const rawResponse = await fetch(urls.deleteById(id), {
      method: 'DELETE',
    });

    const response: ApiResponse<unknown> = await rawResponse.json();

    if ('error' in response) {
      onError(response.error.message);
      return;
    }

    if ('data' in response) {
      onSuccess(t('bui-slc-delete-success'));
      router?.replace(urls.listConfigs);
    }
  };

  return (
    <>
      <section className='mt-5 flex items-center rounded bg-red-100 p-6 text-red-900'>
        <div className='flex-1'>
          <h6 className='mb-1 font-medium'>{t('bui-slc-delete-confirmation')}</h6>
          <p className='font-light'>{t('bui-slc-logs-noop')}</p>
        </div>
        <ButtonDanger
          type='button'
          data-modal-toggle='popup-modal'
          onClick={() => {
            setDelModalVisible(true);
          }}>
          {t('bui-shared-delete')}
        </ButtonDanger>
      </section>
      <ConfirmationModal
        title={t('bui-slc-delete')}
        description={t('bui-slc-delete-modal-confirmation')}
        visible={delModalVisible}
        onConfirm={deleteApp}
        onCancel={() => {
          setDelModalVisible(false);
        }}
      />
    </>
  );
};
