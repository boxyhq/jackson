import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/outline';
import type { IdPConfig } from '@lib/jackson';
import { Modal } from '@supabase/ui';
import { useRouter } from 'next/router';
import { mutate } from 'swr';

const basicFields = [
  { id: 'name', label: 'Name', required: true, type: 'text', placeholder: 'MyApp' },
  {
    id: 'tenant',
    label: 'Tenant',
    required: true,
    type: 'text',
    placeholder: 'acme.com',
  },
  {
    id: 'product',
    label: 'Product',
    required: true,
    type: 'text',
    placeholder: 'demo',
  },
];

const settingsFields = [
  {
    id: 'redirectUrl',
    label: 'Allowed redirect URLs (,Comma separated)',
    required: true,
    type: 'textarea',
    placeholder: 'http://localhost:3000',
    isArray: true,
  },
  {
    id: 'defaultRedirectUrl',
    label: 'Default redirect URL',
    required: true,
    type: 'url',
    placeholder: 'http://localhost:3000/login/saml',
  },
  {
    id: 'rawMetadata',
    label: 'Raw IdP XML',
    required: true,
    type: 'textarea',
    placeholder: 'Paste the raw XML here',
    enabledInEditMode: false,
  },
];

const editModeFields = [
  { id: 'clientID', label: 'ClientID', readOnly: true, type: 'text' },
  { id: 'clientSecret', label: 'Client Secret', readOnly: true, type: 'password' },
  {
    id: 'idpMetadata',
    label: 'IDP Metadata',
    readonly: true,
    type: 'textarea',
    transform: (val) => JSON.stringify(val),
  },
];

function getInitialState(client) {
  const _state: IdPConfig = {} as IdPConfig;
  basicFields.forEach(({ id, isArray = false }: { isArray?: boolean } & typeof basicFields[number]) => {
    _state[id] = client?.[id] ? (isArray ? client[id].join() : client[id]) : '';
  });
  settingsFields.forEach(({ id, isArray = false }: { isArray?: boolean } & typeof basicFields[number]) => {
    _state[id] = client?.[id] ? (isArray ? client[id].join() : client[id]) : '';
  });
  return _state;
}

type AddEditProps = {
  client?: Record<string, any>;
};

const AddEdit = ({ client }: AddEditProps) => {
  const router = useRouter();
  const editMode = !!client;

  const saveIdPConfig = async (event) => {
    event.preventDefault();
    const { rawMetadata, redirectUrl, ...rest } = formObj;
    const encodedRawMetadata = btoa(rawMetadata || '');
    const redirectUrlList = redirectUrl.split(',');

    await fetch('/api/admin/providers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Api-Key secret',
      },
      body: JSON.stringify({ ...rest, encodedRawMetadata, redirectUrl: JSON.stringify(redirectUrlList) }),
    });
  };

  const [delModalVisible, setDelModalVisible] = useState(false);
  const toggleDelConfirm = () => setDelModalVisible(!delModalVisible);
  const [userNameEntry, setUserNameEntry] = useState('');
  const deleteClient = async () => {
    await fetch('/api/admin/providers', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Api-Key secret',
      },
      body: JSON.stringify({ clientID: client?.clientID, clientSecret: client?.clientSecret }),
    });
    toggleDelConfirm();
    await mutate('/api/admin/providers');
    router.replace('/admin/saml');
  };

  const [activeTab, setActiveTab] = useState(0);

  // form state
  const [formObj, setFormObj] = useState<IdPConfig>(() => getInitialState(client));
  function handleChange(event: FormEvent) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    setFormObj((cur) => ({ ...cur, [target.id]: target.value }));
  }

  return (
    <>
      {/* Or use router.back()  */}
      <Link href='/admin/saml'>
        <a className='inline-flex items-center px-4 py-2 mt-2 md:leading-6 text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'>
          <ArrowLeftIcon aria-hidden className='h-4 w-4 text-black dark:text-slate-50' />
          <span className='ml-2'>Back to Clients</span>
        </a>
      </Link>
      <div className='mb-4 border-b border-gray-200 dark:border-gray-700'>
        <ul className='flex flex-wrap -mb-px' id='myTab' data-tabs-toggle='#samlClients' role='tablist'>
          <li className='mr-2' role='presentation'>
            <button
              className={`${
                activeTab === 0 ? 'active ' : ''
              }inline-block py-4 px-4 text-sm font-medium text-center text-gray-500 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300`}
              id='basic-info-tab'
              data-tabs-target='#basic-info'
              type='button'
              role='tab'
              aria-controls='basic-info'
              aria-selected={activeTab === 0}
              onClick={() => setActiveTab(0)}>
              Basic information
            </button>
          </li>
          <li className='mr-2' role='presentation'>
            <button
              className={`${
                activeTab === 1 ? 'active ' : ''
              }inline-block py-4 px-4 text-sm font-medium text-center text-gray-500 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300`}
              id='settings-tab'
              data-tabs-target='#settings'
              type='button'
              role='tab'
              aria-controls='settings'
              aria-selected={activeTab === 1}
              onClick={() => setActiveTab(1)}>
              Settings
            </button>
          </li>
        </ul>
      </div>
      <div id='samlClients'>
        <form onSubmit={saveIdPConfig}>
          <div
            className={`${
              activeTab === 0 ? '' : 'hidden '
            }bg-gradient-to-r bg-white border border-gray-200 code-preview dark:bg-gray-800 dark:border-gray-700 p-6 rounded-xl md:w-3/4 min-w-[28rem] md:max-w-lg`}
            role='tabpanel'
            id='basic-info'
            aria-labelledby='basic-info-tab'>
            {basicFields.map(({ id, placeholder, label, type, required }) => (
              <div className='mb-6 ' key={id}>
                <label
                  htmlFor={id}
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300'>
                  {label}
                </label>
                {type === 'textarea' ? (
                  <textarea
                    id={id}
                    placeholder={placeholder}
                    value={formObj[id]}
                    required={required}
                    onChange={handleChange}
                    className='block p-2 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                    rows={3}
                  />
                ) : (
                  <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    value={formObj[id]}
                    onChange={handleChange}
                    className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                    required={required}
                  />
                )}
              </div>
            ))}

            <button
              type='submit'
              className='bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded leading-6 inline-block'>
              Save Changes
            </button>
          </div>
          <div
            role='tabpanel'
            id='settings'
            aria-labelledby='settings-tab'
            className={`${
              activeTab === 1 ? '' : 'hidden '
            }bg-gradient-to-r bg-white border border-gray-200 code-preview dark:bg-gray-800 dark:border-gray-700 p-6 rounded-xl md:w-3/4 min-w-[28rem] md:max-w-lg`}>
            {settingsFields.map(({ id, placeholder, label, type, required }) => (
              <div className='mb-6 ' key={id}>
                <label
                  htmlFor={id}
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300'>
                  {label}
                </label>
                {type === 'textarea' ? (
                  <textarea
                    id={id}
                    placeholder={placeholder}
                    className='block p-2 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                    rows={3}
                    value={formObj[id]}
                    required={required}
                    onChange={handleChange}
                  />
                ) : (
                  <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                    required={required}
                    value={formObj[id]}
                    onChange={handleChange}
                  />
                )}
              </div>
            ))}
            {editMode &&
              editModeFields.map(({ id, label, type, transform }) => (
                <div className='mb-6' key={id}>
                  <label
                    htmlFor={id}
                    className='block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300'>
                    {label}
                  </label>
                  {type === 'textarea' ? (
                    <textarea
                      id={id}
                      value={typeof transform === 'function' ? transform(client[id]) : client[id]}
                      readOnly={true}
                      onChange={handleChange}
                      className='block p-2 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                      rows={3}
                    />
                  ) : (
                    <input
                      id={id}
                      type={type}
                      className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                      value={typeof transform === 'function' ? transform(client[id]) : client[id]}
                      readOnly
                      onChange={handleChange}
                    />
                  )}
                </div>
              ))}
            <div className='flex justify-between'>
              <button
                type='submit'
                className='bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded leading-6 inline-block'>
                Save Changes
              </button>
            </div>
          </div>
          {client?.clientID && client.clientSecret && (
            <section className='flex items-center text-red-900 bg-red-100 p-6 rounded mt-10'>
              <div className='flex-1'>
                <h6 className='font-medium mb-1'>Delete this application</h6>
                <p className='font-light'>All your apps using this client will stop working.</p>
              </div>
              <button
                type='button'
                className='bg-red-700 hover:bg-red-800 text-white text-sm font-bold py-2 px-4 rounded leading-6 inline-block'
                onClick={toggleDelConfirm}
                data-modal-toggle='popup-modal'>
                Delete
              </button>
            </section>
          )}
        </form>
        <Modal
          closable
          title='Are you absolutely sure ?'
          description='This action cannot be undone. This will permanently delete the application.'
          visible={delModalVisible}
          onCancel={toggleDelConfirm}
          customFooter={
            <div className='inline-flex ml-auto'>
              <button
                type='button'
                onClick={toggleDelConfirm}
                className='bg-white hover:bg-gray-200 border-2  text-sm font-bold py-2 px-4 rounded leading-6 inline-block'>
                Cancel
              </button>
              <button
                type='button'
                disabled={userNameEntry !== client?.product}
                onClick={deleteClient}
                className='ml-1.5 bg-red-700 hover:bg-red-800 disabled:bg-slate-400 text-white text-sm font-bold py-2 px-4 rounded leading-6 inline-block'>
                Delete
              </button>
            </div>
          }>
          <p className='text-slate-600'>
            Please type in the name of the product &apos;
            {client?.product && <strong>{client.product}</strong>}&apos; to confirm.
          </p>
          <label htmlFor='nameOfProd' className='font-medium text-slate-900'>
            Name *
          </label>
          <input
            id='nameOfProd'
            required
            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:white dark:border-gray-600 dark:placeholder-gray-400 d dark:focus:ring-blue-500 dark:focus:border-blue-500'
            value={userNameEntry}
            onChange={({ target }) => {
              setUserNameEntry(target.value);
            }}></input>
        </Modal>
      </div>
    </>
  );
};

export default AddEdit;
