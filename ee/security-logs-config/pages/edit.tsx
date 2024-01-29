import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import type { SecurityLogsConfig } from '@boxyhq/saml-jackson';
import { fetcher } from '@lib/ui/utils';
import Loading from '@components/Loading';
import { errorToast, successToast } from '@components/Toaster';
import ConfirmationModal from '@components/ConfirmationModal';
import type { ApiError, ApiResponse, ApiSuccess } from 'types';
import { LinkBack } from '@components/LinkBack';
import { ButtonPrimary } from '@components/ButtonPrimary';
import { ButtonDanger } from '@components/ButtonDanger';
import { SinkConfigMapField, getFieldsFromSinkType } from '@lib/sinkConfigMap';
import LicenseRequired from '@components/LicenseRequired';

const UpdateApp = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>({});
  const [fields, setFields] = useState<SinkConfigMapField[]>([]);

  const { id } = router.query as { id: string };

  const { data, error, isLoading } = useSWR<ApiSuccess<SecurityLogsConfig>, ApiError>(
    `/api/admin/security-logs-config/${id}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (data) {
      setConfig(data.data?.config);
      setFields(getFieldsFromSinkType(data.data?.type) || []);
    }
  }, [data]);

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  if (isLoading) {
    return <Loading />;
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch(`/api/admin/security-logs-config/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config,
      }),
    });

    setLoading(false);

    const response: ApiResponse<SecurityLogsConfig> = await rawResponse.json();

    if ('error' in response) {
      errorToast(response.error.message);
      return;
    }

    if ('data' in response) {
      successToast(t('security_logs_config_success'));
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;

    setConfig({
      ...config,
      [target.id]: target.value,
    });
  };

  return (
    <>
      <LinkBack href='/admin/settings/security-logs' />
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='mt-5 font-bold text-gray-700 md:text-xl'>{t('security_logs_config_update')}</h2>
      </div>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <form onSubmit={onSubmit}>
          <div className='space-y-3'>
            {fields.map((field) => {
              return (
                <div className='form-control w-full md:w-1/2' key={field.index}>
                  <label className='label'>
                    <span className='label-text'>{t(field.label)}</span>
                  </label>
                  <input
                    type={field.type}
                    className='input-bordered input'
                    id={field.name}
                    placeholder={t(field.placeholder)}
                    value={config[field.name]}
                    onChange={onChange}
                  />
                </div>
              );
            })}
            <div>
              <ButtonPrimary type='submit' loading={loading}>
                {t('save_changes')}
              </ButtonPrimary>
            </div>
          </div>
        </form>
      </div>
      <DeleteApp id={id} />
    </>
  );
};

export const DeleteApp = ({ id }: { id }) => {
  const { t } = useTranslation('common');
  const [delModalVisible, setDelModalVisible] = useState(false);

  const deleteApp = async () => {
    const rawResponse = await fetch(`/api/admin/security-logs-config/${id}`, {
      method: 'DELETE',
    });

    const response: ApiResponse<unknown> = await rawResponse.json();

    if ('error' in response) {
      errorToast(response.error.message);
      return;
    }

    if ('data' in response) {
      successToast(t('security_logs_config_delete_success'));
      window.location.href = '/admin/settings/security-logs';
    }
  };

  return (
    <>
      <section className='mt-5 flex items-center rounded bg-red-100 p-6 text-red-900'>
        <div className='flex-1'>
          <h6 className='mb-1 font-medium'>{t('delete_this_security_logs_config')}</h6>
          <p className='font-light'>{t('security_logs_wont_be_sent_to_this')}</p>
        </div>
        <ButtonDanger
          type='button'
          data-modal-toggle='popup-modal'
          onClick={() => {
            setDelModalVisible(true);
          }}>
          {t('delete')}
        </ButtonDanger>
      </section>
      <ConfirmationModal
        title={t('delete_the_security_logs_config')}
        description={t('confirmation_modal_description_config')}
        visible={delModalVisible}
        onConfirm={deleteApp}
        onCancel={() => {
          setDelModalVisible(false);
        }}
      />
    </>
  );
};

export default UpdateApp;
