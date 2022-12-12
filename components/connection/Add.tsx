import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { getCommonFields } from './fieldCatalog';
import { saveConnection, fieldCatalogFilterByConnection, renderFieldList } from './utils';
import { mutate } from 'swr';
import { ApiResponse } from 'types';
import { errorToast } from '@components/Toast';
import { useTranslation } from 'next-i18next';

const fieldCatalog = [...getCommonFields()];

type AddProps = {
  setup?: Record<string, any>;
};

const Add = ({ setup }: AddProps) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  // STATE: New connection type
  const [newConnectionType, setNewConnectionType] = useState<'saml' | 'oidc'>('saml');
  const handleNewConnectionTypeChange = (event) => {
    setNewConnectionType(event.target.value);
  };

  const connectionIsSAML = newConnectionType === 'saml';
  const connectionIsOIDC = newConnectionType === 'oidc';
  // FORM LOGIC: SUBMIT
  const save = async (event) => {
    event.preventDefault();
    saveConnection({
      formObj: formObj,
      connectionIsSAML: connectionIsSAML,
      connectionIsOIDC: connectionIsOIDC,
      setupToken: setup ? (setup.token as string) : '',
      callback: async (res) => {
        const response: ApiResponse = await res.json();

        if ('error' in response) {
          errorToast(response.error.message);
          return;
        }

        if (res.ok) {
          await mutate(setup ? `/api/setup/${setup.token}/connections` : '/api/admin/connections');
          router.replace(setup ? `/setup/${setup.token}/sso-connection` : '/admin/sso-connection');
        }
      },
    });
  };

  // STATE: FORM
  const [formObj, setFormObj] = useState<Record<string, string>>({});

  return (
    <>
      <Link
        href={setup ? `/setup/${setup.token}` : '/admin/sso-connection'}
        className='btn-outline btn items-center space-x-2'>
        <ArrowLeftIcon aria-hidden className='h-4 w-4' />
        <span>{t('back')}</span>
      </Link>
      <div>
        <h2 className='mb-5 mt-5 font-bold text-gray-700 dark:text-white md:text-xl'>
          {t('create_sso_connection')}
        </h2>
        <div className='mb-4 flex'>
          <div className='mr-2 py-3'>{t('select_type')}:</div>
          <div className='flex flex-nowrap items-stretch justify-start gap-1 rounded-md border-2 border-dashed py-3'>
            <div>
              <input
                type='radio'
                name='connection'
                value='saml'
                className='peer sr-only'
                checked={newConnectionType === 'saml'}
                onChange={handleNewConnectionTypeChange}
                id='saml-conn'></input>
              <label
                htmlFor='saml-conn'
                className='cursor-pointer rounded-md border-2 border-solid py-3 px-8 font-semibold hover:shadow-md peer-checked:border-secondary-focus peer-checked:bg-secondary peer-checked:text-white'>
                {t('saml')}
              </label>
            </div>
            <div>
              <input
                type='radio'
                name='connection'
                value='oidc'
                className='peer sr-only'
                checked={newConnectionType === 'oidc'}
                onChange={handleNewConnectionTypeChange}
                id='oidc-conn'></input>
              <label
                htmlFor='oidc-conn'
                className='cursor-pointer rounded-md border-2 border-solid px-8 py-3 font-semibold hover:shadow-md peer-checked:bg-secondary peer-checked:text-white'>
                {t('oidc')}
              </label>
            </div>
          </div>
        </div>
        <form onSubmit={save}>
          <div className='min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
            {fieldCatalog
              .filter(fieldCatalogFilterByConnection(newConnectionType))
              .filter(({ attributes: { hideInSetupView } }) => (setup ? !hideInSetupView : true))
              .map(renderFieldList({ formObj, setFormObj }))}
            <div className='flex'>
              <button type='submit' className='btn-primary btn'>
                {t('save_changes')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default Add;
