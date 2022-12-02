import { FormEvent, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import ConfirmationModal from '@components/ConfirmationModal';
import { useRouter } from 'next/router';

const CreateSetupLink = (props: { service: 'sso' | 'dsync' }) => {
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
      setLoading(false);
      const json = await res.json();
      setUrl(json.data.url);
      setStatus({ status: 'SUCCESS', linkPanelStatus: 'UNKNOWN' });
      setTimeout(() => setStatus({ status: 'UNKNOWN', linkPanelStatus: 'UNKNOWN' }), 2000);
    } else {
      // save failed
      setLoading(false);
      setStatus({ status: 'ERROR', linkPanelStatus: 'UNKNOWN' });
      setTimeout(() => setStatus({ status: 'UNKNOWN', linkPanelStatus: 'UNKNOWN' }), 2000);
    }
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
      setStatus({ linkPanelStatus: 'SUCCESS', status: 'UNKNOWN' });
      setTimeout(() => setStatus({ linkPanelStatus: 'UNKNOWN', status: 'UNKNOWN' }), 2000);
    } else {
      // save failed
      setLoading1(false);
      setStatus({ linkPanelStatus: 'ERROR', status: 'UNKNOWN' });
      setTimeout(() => setStatus({ linkPanelStatus: 'UNKNOWN', status: 'UNKNOWN' }), 2000);
    }
  };
  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    setStatus({ linkPanelStatus: 'COPIED', status: 'UNKNOWN' });
    setTimeout(() => setStatus({ linkPanelStatus: 'UNKNOWN', status: 'UNKNOWN' }), 2000);
  };
  const [{ status, linkPanelStatus }, setStatus] = useState<{
    status: 'UNKNOWN' | 'SUCCESS' | 'ERROR' | 'COPIED';
    linkPanelStatus: 'UNKNOWN' | 'SUCCESS' | 'ERROR' | 'COPIED';
  }>({
    status: 'UNKNOWN',
    linkPanelStatus: 'UNKNOWN',
  });
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
      <Link href='' onClick={() => router.back()} className='btn-outline btn items-center space-x-2'>
        <ArrowLeftIcon aria-hidden className='h-4 w-4' />
        <span>Back</span>
      </Link>
      <div className='mt-5 min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <h2 className='mb-5 mt-5 font-bold text-gray-700 dark:text-white md:text-xl'>
          {`Create Setup Link (${props.service === 'sso' ? 'Enterprise SSO' : 'Directory-Sync'})`}
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
          <button
            className={`btn-primary btn mx-2 mt-5 ${loading ? 'loading' : ''}`}
            disabled={!formObj.tenant || !formObj.product || !formObj.type}
            onClick={createLink}>
            {'Generate'}
          </button>
        </div>
        <p
          role='status'
          className={`mt-4 ml-2 inline-flex items-center ${
            status === 'SUCCESS' || status === 'ERROR' ? 'opacity-100' : 'opacity-0'
          } transition-opacity motion-reduce:transition-none`}>
          {status === 'SUCCESS' && (
            <span className='inline-flex items-center text-primary'>
              <CheckCircleIcon aria-hidden className='mr-1 h-5 w-5'></CheckCircleIcon>
              Link Generated
            </span>
          )}
          {/* TODO: also display error message once we standardise the response format */}
          {status === 'ERROR' && (
            <span className='inline-flex items-center text-red-900'>
              <ExclamationCircleIcon aria-hidden className='mr-1 h-5 w-5'></ExclamationCircleIcon>
              ERROR
            </span>
          )}
        </p>
        <ConfirmationModal
          title='Delete the setup link'
          description='This action cannot be undone. This will permanently delete the link.'
          visible={delModalVisible}
          onConfirm={regenerateLink}
          onCancel={toggleDelConfirm}
          actionButtonText={'Regenerate'}
        />
      </div>
      {url && (
        <div className='mt-5 min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
          <h2 className='mb-5 mt-5 font-bold text-gray-700 dark:text-white md:text-xl'>
            {url ? 'Setup Link Info' : `Create Setup Link (${props.service})`}
          </h2>
          <div className='form-control p-2'>
            <div className='input-group'>
              <button className='btn-primary btn h-10 p-2 text-white' onClick={copyUrl}>
                <ClipboardDocumentListIcon className='h-6 w-6' />
              </button>
              <input type='text' readOnly value={url} className='input-bordered input h-10 w-full' />
            </div>
          </div>
          <div className='flex'>
            <button
              className={`btn-primary btn mx-2 mt-5 ${loading1 ? 'loading' : ''}`}
              disabled={!formObj.tenant || !formObj.product || !formObj.type}
              onClick={
                url
                  ? () => {
                      setDelModalVisible(true);
                    }
                  : createLink
              }>
              {url ? 'Regenerate Link' : 'Generate'}
            </button>
          </div>
          <p
            role='status'
            className={`mt-4 ml-2 inline-flex items-center ${
              linkPanelStatus === 'SUCCESS' || linkPanelStatus === 'COPIED' || linkPanelStatus === 'ERROR'
                ? 'opacity-100'
                : 'opacity-0'
            } transition-opacity motion-reduce:transition-none`}>
            {linkPanelStatus === 'SUCCESS' && (
              <span className='inline-flex items-center text-primary'>
                <CheckCircleIcon aria-hidden className='mr-1 h-5 w-5'></CheckCircleIcon>
                Link Regenerated
              </span>
            )}
            {linkPanelStatus === 'COPIED' && (
              <span className='inline-flex items-center text-primary'>
                <CheckCircleIcon aria-hidden className='mr-1 h-5 w-5'></CheckCircleIcon>
                Copied
              </span>
            )}
            {/* TODO: also display error message once we standardise the response format */}
            {linkPanelStatus === 'ERROR' && (
              <span className='inline-flex items-center text-red-900'>
                <ExclamationCircleIcon aria-hidden className='mr-1 h-5 w-5'></ExclamationCircleIcon>
                ERROR
              </span>
            )}
          </p>
        </div>
      )}
    </>
  );
};

export default CreateSetupLink;
