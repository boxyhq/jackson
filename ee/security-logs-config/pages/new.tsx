import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { errorToast, successToast } from '@components/Toaster';
import LicenseRequired from '@components/LicenseRequired';
import { configMap } from '@lib/sinkConfigMap';
import { ButtonPrimary, LinkBack } from '@boxyhq/internal-ui';

const NewConfiguration = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({});
  const [name, setName] = useState('');
  const [type, setType] = useState(t('select_type'));

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch('/api/admin/security-logs-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, type: configMap[type].type, config }),
    });

    setLoading(false);

    const response = await rawResponse.json();

    if ('error' in response) {
      errorToast(response.error.message);
      return;
    }

    if ('data' in response) {
      successToast(t('security_logs_config_new_success'));
      router.replace(`/admin/settings/security-logs`);
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
      <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>{t('security_logs_config_add_new')}</h2>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <form onSubmit={onSubmit}>
          <div className='flex flex-col space-y-3'>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('bui-shared-type')}</span>
              </label>
              <select
                className='select-bordered select w-full'
                id='type'
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                }}
                required>
                {[t('select_type'), ...Object.keys(configMap)].map((key) => {
                  return (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('bui-shared-name')}</span>
              </label>
              <input
                type='text'
                id='name'
                className='input-bordered input'
                value={name}
                required={false}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('bui-shared-name')}
              />
            </div>
            {type && (
              <>
                {configMap[type] &&
                  configMap[type].fields.map((field) => {
                    return (
                      <div key={field.index} className='form-control w-full md:w-1/2'>
                        <label className='label'>
                          <span className='label-text'>{t(field.label)}</span>
                        </label>
                        <input
                          type={field.type}
                          id={field.name}
                          className='input-bordered input'
                          required
                          onChange={onChange}
                          placeholder={t(field.placeholder)}
                        />
                      </div>
                    );
                  })}
              </>
            )}
            <div>
              <ButtonPrimary loading={loading}>{t('create_config')}</ButtonPrimary>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default NewConfiguration;
