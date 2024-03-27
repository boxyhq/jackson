import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import type { Directory } from '@boxyhq/saml-jackson';
import type { ApiResponse } from 'types';
import { errorToast, successToast } from '@components/Toaster';
import { ButtonDanger, ConfirmationModal } from '@boxyhq/internal-ui';

export const DeleteDirectory = ({
  directoryId,
  setupLinkToken,
}: {
  directoryId: Directory['id'];
  setupLinkToken?: string;
}) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [delModalVisible, setDelModalVisible] = useState(false);

  const deleteDirectory = async () => {
    const deleteUrl = setupLinkToken
      ? `/api/setup/${setupLinkToken}/directory-sync/${directoryId}`
      : `/api/admin/directory-sync/${directoryId}`;

    const rawResponse = await fetch(deleteUrl, {
      method: 'DELETE',
    });

    const response: ApiResponse<unknown> = await rawResponse.json();

    if ('error' in response) {
      errorToast(response.error.message);
      return;
    }

    if ('data' in response) {
      const redirectUrl = setupLinkToken
        ? `/setup/${setupLinkToken}/directory-sync`
        : '/admin/directory-sync';

      successToast(t('directory_connection_deleted_successfully'));
      router.replace(redirectUrl);
    }
  };

  return (
    <>
      <section className='mt-5 flex items-center rounded bg-red-100 p-6 text-red-900'>
        <div className='flex-1'>
          <h6 className='mb-1 font-medium'>{t('delete_this_directory')}</h6>
          <p className='font-light'>{t('delete_this_directory_desc')}</p>
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
        title={t('delete_this_directory')}
        description={t('delete_this_directory_desc')}
        visible={delModalVisible}
        onConfirm={deleteDirectory}
        onCancel={() => {
          setDelModalVisible(false);
        }}
      />
    </>
  );
};
