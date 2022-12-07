import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getCommonFields } from './fieldCatalog';
import { saveConnection, fieldCatalogFilterByConnection, renderFieldList } from './utils';

type AddProps = {
  showBackButton?: boolean;
  titleText?: string;
  readonlyTenant?: string;
  readonlyProduct?: string;
};

const Add = ({
  showBackButton = true,
  titleText = 'Create SSO Connection',
  readonlyProduct = '',
  readonlyTenant = '',
}: AddProps) => {
  const fieldCatalog = [
    ...getCommonFields({
      readonlyProduct,
      readonlyTenant,
    }),
  ];
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
      callback: (res) => {
        if (res.ok) {
          router.replace('/admin/connection');
        } else {
          // save failed
          toast.error('ERROR');
        }
      },
    });
  };

  const getInitialFormState = () => {
    const initState = {};
    if (readonlyTenant) {
      initState['tenant'] = readonlyTenant;
    }
    if (readonlyProduct) {
      initState['product'] = readonlyProduct;
    }
    return initState;
  };

  // STATE: FORM
  const [formObj, setFormObj] = useState<Record<string, string>>(getInitialFormState());

  return (
    <>
      {showBackButton && (
        <Link href='/admin/connection' className='btn-outline btn items-center space-x-2'>
          <ArrowLeftIcon aria-hidden className='h-4 w-4' />
          <span>Back</span>
        </Link>
      )}
      <div>
        <h2 className='mb-5 mt-5 font-bold text-gray-700 dark:text-white md:text-xl'>{titleText}</h2>
        <div className='mb-4 flex'>
          <div className='mr-2 py-3'>Select Type:</div>
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
              {/* var(--radio-border-width) solid var(--color-gray) */}
              <label
                htmlFor='saml-conn'
                className='cursor-pointer rounded-md border-2 border-solid py-3 px-8 font-semibold hover:shadow-md peer-checked:border-secondary-focus peer-checked:bg-secondary peer-checked:text-white'>
                SAML
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
                OIDC
              </label>
            </div>
          </div>
        </div>
        <form onSubmit={save}>
          <div className='min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
            {fieldCatalog
              .filter(fieldCatalogFilterByConnection(newConnectionType))
              .map(renderFieldList({ formObj, setFormObj }))}
            <div className='flex'>
              <button type='submit' className='btn-primary btn'>
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default Add;
