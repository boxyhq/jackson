import { FormEvent, useState } from 'react';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '@components/ConfirmationModal';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { errorToast, successToast } from '@components/Toast';
import { copyToClipboard } from '@lib/ui/utils';
import { Button } from './Button';
import { ButtonBack } from './ButtonBack';

const CreateSetupLink = (props: { service: 'sso' | 'dsync' }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const createLink = async (event) => {
    event.preventDefault();
    setLoading(true);
    const { tenant, product, type } = formObj;
    const res = await fetch('/api/admin/setup-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenant,
        product,
        type,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      setUrl(json.data.url);
      successToast(t('link_generated'));
    } else {
      const rsp = await res.json();
      errorToast(rsp?.error?.message || t('server_error'));
    }
    setLoading(false);
  };
  const regenerateLink = async (event) => {
    event.preventDefault();
    setLoading1(true);
    setDelModalVisible(!delModalVisible);
    const { tenant, product, type } = formObj;

    const res = await fetch('/api/admin/setup-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenant,
        product,
        type,
        regenerate: true,
      }),
    });
    if (res.ok) {
      setLoading1(false);
      const json = await res.json();
      setUrl(json.data.url);
      successToast(t('link_regenerated'));
    } else {
      // save failed
      setLoading1(false);
      errorToast(t('server_error'));
    }
  };
  const getHandleChange = (event: FormEvent) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    setFormObj((cur) => ({ ...cur, [target.name]: target.value }));
  };
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loading1, setLoading1] = useState<boolean>(false);
  const [formObj, setFormObj] = useState<Record<string, string>>({
    tenant: '',
    product: '',
    type: props.service || 'sso',
  });
  const [delModalVisible, setDelModalVisible] = useState(false);
  const toggleDelConfirm = () => setDelModalVisible(!delModalVisible);

  return (
    <>
      <ButtonBack onClick={() => router.back()} />
      <div className='mt-5 min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <h2 className='mb-5 font-bold text-gray-700 dark:text-white md:text-xl'>
          {t('create_setup_link', {
            service: props.service === 'sso' ? t('enterprise_sso') : t('directory_sync'),
          })}
        </h2>
        <div>
          <div className='mb-6'>
            <label
              htmlFor='tenant'
              className={`mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300`}>
              {'Tenant'}
            </label>
            <input
              id='tenant'
              name='tenant'
              type='text'
              placeholder='acme.com'
              value={formObj['tenant']}
              required={true}
              readOnly={false}
              onChange={getHandleChange}
              className='input-bordered input w-full'
            />
          </div>
          <div className='mb-6'>
            <label
              htmlFor='tenant'
              className={`mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300`}>
              {'Product'}
            </label>
            <input
              id='product'
              name='product'
              type='text'
              placeholder='demo'
              value={formObj['product']}
              required={true}
              readOnly={false}
              onChange={getHandleChange}
              className='input-bordered input w-full'
            />
          </div>
        </div>
        <div className='flex'>
          <Button
            color='primary'
            loading={loading}
            disabled={!formObj.tenant || !formObj.product || !formObj.type}
            onClick={createLink}>
            {t('generate')}
          </Button>
        </div>
        <ConfirmationModal
          title='Delete the setup link'
          description='This action cannot be undone. This will permanently delete the link.'
          visible={delModalVisible}
          onConfirm={regenerateLink}
          onCancel={toggleDelConfirm}
          actionButtonText={t('regenerate')}
        />
      </div>
      {url && (
        <div className='mt-5 min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
          <h2 className='mb-5 font-bold text-gray-700 dark:text-white md:text-xl'>
            {url
              ? t('setup_link_info')
              : t('create_setup_link', {
                  service: props.service === 'sso' ? t('enterprise_sso') : t('directory_sync'),
                })}
          </h2>
          <div className='form-control'>
            <div className='input-group'>
              <Button
                Icon={ClipboardDocumentIcon}
                className='p-2'
                color='primary'
                onClick={() => {
                  copyToClipboard(url);
                  successToast(t('copied'));
                }}></Button>
              <input type='text' readOnly value={url} className='input-bordered input h-10 w-full' />
            </div>
          </div>
          <div className='mt-5 flex'>
            <Button
              color='primary'
              loading={loading1}
              disabled={!formObj.tenant || !formObj.product || !formObj.type}
              onClick={
                url
                  ? () => {
                      setDelModalVisible(true);
                    }
                  : createLink
              }>
              {url ? t('regenerate') : t('generate')}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateSetupLink;
