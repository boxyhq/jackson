import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { mutate } from 'swr';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import ConfirmationModal from '@components/ConfirmationModal';
import { EditViewOnlyFields, getCommonFields } from './fieldCatalog';
import { saveConnection, fieldCatalogFilterByConnection, renderFieldList } from './utils';
import { ApiResponse } from 'types';

const fieldCatalog = [...getCommonFields(true), ...EditViewOnlyFields];

function getInitialState(connection) {
  const _state = {};

  fieldCatalog.forEach(({ key, attributes }) => {
    let value;

    if (typeof attributes.accessor === 'function') {
      value = attributes.accessor(connection);
    } else {
      value = connection?.[key];
    }
    _state[key] = value
      ? attributes.isArray
        ? value.join('\r\n') // render list of items on newline eg:- redirect URLs
        : value
      : '';
  });
  return _state;
}

type EditProps = {
  connection?: Record<string, any>;
};

const Edit = ({ connection }: EditProps) => {
  const router = useRouter();

  const { id: connectionClientId } = router.query;
  const connectionIsSAML = connection?.idpMetadata && typeof connection.idpMetadata === 'object';
  const connectionIsOIDC = connection?.oidcProvider && typeof connection.oidcProvider === 'object';
  // FORM LOGIC: SUBMIT
  const save = async (event) => {
    event.preventDefault();
    saveConnection({
      formObj: formObj,
      connectionIsSAML: connectionIsSAML,
      connectionIsOIDC: connectionIsOIDC,
      isEditView: true,
      callback: async (res) => {
        const { error }: ApiResponse = await res.json();

        if (res.ok) {
          toast.success('Saved');
          mutate(`/api/admin/connections/${connectionClientId}`);
        } else {
          toast.error(error.message);
        }
      },
    });
  };

  // LOGIC: DELETE
  const [delModalVisible, setDelModalVisible] = useState(false);
  const toggleDelConfirm = () => setDelModalVisible(!delModalVisible);
  const deleteConnection = async () => {
    const res = await fetch('/api/admin/connections', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientID: connection?.clientID, clientSecret: connection?.clientSecret }),
    });

    const { error }: ApiResponse = await res.json();

    toggleDelConfirm();

    if (res.ok) {
      await mutate('/api/admin/connections');
      router.replace('/admin/connection');
    } else {
      toast.error(error.message);
    }
  };

  // STATE: FORM
  const [formObj, setFormObj] = useState<Record<string, string>>(() => getInitialState(connection));
  // Resync form state on save
  useEffect(() => {
    const _state = getInitialState(connection);
    setFormObj(_state);
  }, [connection]);

  const filteredFieldsByConnection = fieldCatalog.filter(
    fieldCatalogFilterByConnection(connectionIsSAML ? 'saml' : connectionIsOIDC ? 'oidc' : null)
  );

  return (
    <>
      <Link href='/admin/connection' className='btn-outline btn items-center space-x-2'>
        <ArrowLeftIcon aria-hidden className='h-4 w-4' />
        <span>Back</span>
      </Link>
      <div>
        <h2 className='mb-5 mt-5 font-bold text-gray-700 dark:text-white md:text-xl'>
          {'Edit SSO Connection'}
        </h2>
        <form onSubmit={save}>
          <div className='min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 lg:border-none lg:p-0'>
            <div className='flex flex-col gap-0 lg:flex-row lg:gap-4'>
              <div className='w-full rounded border-gray-200 dark:border-gray-700 lg:w-3/5 lg:border lg:p-3'>
                {filteredFieldsByConnection
                  .filter((field) => field.attributes.editable !== false)
                  .map(renderFieldList({ isEditView: true, formObj, setFormObj }))}
              </div>
              <div className='w-full rounded border-gray-200 dark:border-gray-700 lg:w-2/5 lg:border lg:p-3'>
                {filteredFieldsByConnection
                  .filter((field) => field.attributes.editable === false)
                  .map(renderFieldList({ isEditView: true, formObj, setFormObj }))}
              </div>
            </div>
            <div className='flex w-full lg:mt-6'>
              <button type='submit' className='btn-primary btn'>
                Save Changes
              </button>
            </div>
          </div>
          {connection?.clientID && connection.clientSecret && (
            <section className='mt-10 flex items-center rounded bg-red-100 p-6 text-red-900'>
              <div className='flex-1'>
                <h6 className='mb-1 font-medium'>Delete this connection</h6>
                <p className='font-light'>All your apps using this connection will stop working.</p>
              </div>
              <button
                type='button'
                className='btn-error btn'
                onClick={toggleDelConfirm}
                data-modal-toggle='popup-modal'>
                Delete
              </button>
            </section>
          )}
        </form>
        <ConfirmationModal
          title='Delete the Connection?'
          description='This action cannot be undone. This will permanently delete the Connection.'
          visible={delModalVisible}
          onConfirm={deleteConnection}
          onCancel={toggleDelConfirm}></ConfirmationModal>
      </div>
    </>
  );
};

export default Edit;
