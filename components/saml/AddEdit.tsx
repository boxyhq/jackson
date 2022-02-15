import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, useState } from 'react';
import { mutate } from 'swr';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/outline';
import { Modal } from '@supabase/ui';

/**
 * Edit view will have extra fields (showOnlyInEditView: true)
 * to render parsed metadata and other attributes.
 * All fields are editable unless they have `editable` set to false.
 * All fields are required unless they have `required` set to false.
 */
const fieldCatalog = [
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'MyApp',
    attributes: {},
  },
  {
    key: 'description',
    label: 'Description',
    type: 'text',
    placeholder: 'A short description not more than 100 characters',
    attributes: { maxLength: 100, required: false, requiredInEditView: false }, // not required in create/edit view
  },
  {
    key: 'tenant',
    label: 'Tenant',
    type: 'text',
    placeholder: 'acme.com',
    attributes: { editable: false },
  },
  {
    key: 'product',
    label: 'Product',
    type: 'text',
    placeholder: 'demo',
    attributes: { editable: false },
  },
  {
    key: 'redirectUrl',
    label: 'Allowed redirect URLs (newline separated)',
    type: 'textarea',
    placeholder: 'http://localhost:3000',
    attributes: { isArray: true, rows: 3 },
  },
  {
    key: 'defaultRedirectUrl',
    label: 'Default redirect URL',
    type: 'url',
    placeholder: 'http://localhost:3000/login/saml',
    attributes: {},
  },
  {
    key: 'rawMetadata',
    label: 'Raw IdP XML',
    type: 'textarea',
    placeholder: 'Paste the raw XML here',
    attributes: {
      rows: 5,
      requiredInEditView: false, //not required in edit view
      labelInEditView: 'Raw IdP XML (fully replaces the current one)',
    },
  },
  {
    key: 'idpMetadata',
    label: 'IDP Metadata',
    type: 'pre',
    attributes: {
      rows: 10,
      editable: false,
      showOnlyInEditView: true,
      formatForDisplay: (value) => JSON.stringify(value, null, 2),
    },
  },
  {
    key: 'clientID',
    label: 'Client Id',
    type: 'text',
    attributes: { showOnlyInEditView: true },
  },
  {
    key: 'clientSecret',
    label: 'Client Secret',
    type: 'password',
    attributes: { showOnlyInEditView: true },
  },
];

function getFieldList(isEditView) {
  return isEditView
    ? fieldCatalog
    : fieldCatalog.filter(({ attributes: { showOnlyInEditView } }) => !showOnlyInEditView); // filtered list for add view
}

function getInitialState(samlConfig, isEditView) {
  const _state = {};
  const _fieldCatalog = getFieldList(isEditView);

  _fieldCatalog.forEach(({ key, attributes }) => {
    _state[key] = samlConfig?.[key]
      ? attributes.isArray
        ? samlConfig[key].join('\r\n') // render list of items on newline eg:- redirect URLs
        : samlConfig[key]
      : '';
  });
  return _state;
}

type AddEditProps = {
  samlConfig?: Record<string, any>;
};

const AddEdit = ({ samlConfig }: AddEditProps) => {
  const router = useRouter();
  const isEditView = !!samlConfig;
  // FORM LOGIC: SUBMIT
  const [{ status }, setSaveStatus] = useState<{ status: 'UNKNOWN' | 'SUCCESS' | 'ERROR' }>({
    status: 'UNKNOWN',
  });
  const saveSAMLConfiguration = async (event) => {
    event.preventDefault();
    const { rawMetadata, redirectUrl, ...rest } = formObj;
    const encodedRawMetadata = btoa(rawMetadata || '');
    const redirectUrlList = redirectUrl.split(/\r\n|\r|\n/);

    const res = await fetch('/api/admin/saml/config', {
      method: isEditView ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Api-Key secret',
      },
      body: JSON.stringify({ ...rest, encodedRawMetadata, redirectUrl: JSON.stringify(redirectUrlList) }),
    });
    if (res.ok) {
      if (!isEditView) {
        router.replace('/admin/saml/config');
      } else {
        setSaveStatus({ status: 'SUCCESS' });
        // revalidate on save
        mutate(`/api/admin/saml/config/${router.query.id}`);
        setTimeout(() => setSaveStatus({ status: 'UNKNOWN' }), 2000);
      }
    } else {
      // save failed
      setSaveStatus({ status: 'ERROR' });
      setTimeout(() => setSaveStatus({ status: 'UNKNOWN' }), 2000);
    }
  };

  // LOGIC: DELETE
  const [delModalVisible, setDelModalVisible] = useState(false);
  const toggleDelConfirm = () => setDelModalVisible(!delModalVisible);
  const [userNameEntry, setUserNameEntry] = useState('');
  const deleteConfiguration = async () => {
    await fetch('/api/admin/saml/config', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Api-Key secret',
      },
      body: JSON.stringify({ clientID: samlConfig?.clientID, clientSecret: samlConfig?.clientSecret }),
    });
    toggleDelConfirm();
    await mutate('/api/admin/saml/config');
    router.replace('/admin/saml/config');
  };

  // STATE: FORM
  const [formObj, setFormObj] = useState<Record<string, string>>(() =>
    getInitialState(samlConfig, isEditView)
  );
  function handleChange(event: FormEvent) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    setFormObj((cur) => ({ ...cur, [target.id]: target.value }));
  }

  return (
    <>
      {/* Or use router.back()  */}
      <Link href='/admin/saml/config'>
        <a className='link-primary'>
          <ArrowLeftIcon aria-hidden className='h-4 w-4' />
          <span className='ml-2'>Back to Configurations</span>
        </a>
      </Link>
      <div>
        <h2 className='font-bold text-3xl text-primary  mt-2 mb-4 dark:text-white'>
          {samlConfig?.name || samlConfig?.product || 'New SAML Configuration'}
        </h2>
        <form onSubmit={saveSAMLConfiguration}>
          <div className='bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6 rounded-xl md:w-3/4 min-w-[28rem] md:max-w-lg'>
            {fieldCatalog
              .filter(({ attributes: { showOnlyInEditView } }) => (isEditView ? true : !showOnlyInEditView))
              .map(
                ({
                  key,
                  placeholder,
                  label,
                  type,
                  attributes: {
                    isArray,
                    rows,
                    formatForDisplay,
                    editable,
                    requiredInEditView = true, // by default all fields are required unless explicitly set to false
                    labelInEditView,
                    maxLength,
                    required = true, // by default all fields are required unless explicitly set to false
                  },
                }) => {
                  const readOnly = isEditView && editable === false;
                  const _required = isEditView ? !!requiredInEditView : !!required;
                  const _label = isEditView && labelInEditView ? labelInEditView : label;
                  const value =
                    readOnly && typeof formatForDisplay === 'function'
                      ? formatForDisplay(formObj[key])
                      : formObj[key];
                  return (
                    <div className='mb-6 ' key={key}>
                      <label
                        htmlFor={key}
                        className='block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300'>
                        {_label}
                      </label>
                      {type === 'pre' ? (
                        <pre className='block p-2 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 overflow-auto'>
                          {value}
                        </pre>
                      ) : type === 'textarea' ? (
                        <textarea
                          id={key}
                          placeholder={placeholder}
                          value={value}
                          required={_required}
                          readOnly={readOnly}
                          maxLength={maxLength}
                          onChange={handleChange}
                          className={`block p-2 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
                            isArray ? 'whitespace-pre' : ''
                          }`}
                          rows={rows}
                        />
                      ) : (
                        <input
                          id={key}
                          type={type}
                          placeholder={placeholder}
                          value={value}
                          required={_required}
                          readOnly={readOnly}
                          maxLength={maxLength}
                          onChange={handleChange}
                          className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                        />
                      )}
                    </div>
                  );
                }
              )}
            <div className='flex'>
              <button type='submit' className='btn-primary'>
                Save Changes
              </button>
              <p
                role='status'
                className={`ml-2 inline-flex items-center ${
                  status === 'SUCCESS' || status === 'ERROR' ? 'opacity-100' : 'opacity-0'
                } transition-opacity motion-reduce:transition-none`}>
                {status === 'SUCCESS' && (
                  <span className='text-primary inline-flex items-center'>
                    <CheckCircleIcon aria-hidden className='mr-1 h-5 w-5'></CheckCircleIcon>
                    Saved
                  </span>
                )}
                {/* TODO: also display error message once we standardise the response format */}
                {status === 'ERROR' && (
                  <span className='text-red-900 inline-flex items-center'>
                    <ExclamationCircleIcon aria-hidden className='mr-1 h-5 w-5'></ExclamationCircleIcon>
                    ERROR
                  </span>
                )}
              </p>
            </div>
          </div>
          {samlConfig?.clientID && samlConfig.clientSecret && (
            <section className='flex items-center text-red-900 bg-red-100 p-6 rounded mt-10'>
              <div className='flex-1'>
                <h6 className='font-medium mb-1'>Delete this configuration</h6>
                <p className='font-light'>All your apps using this configuration will stop working.</p>
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
          description='This action cannot be undone. This will permanently delete the SAML config.'
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
                disabled={userNameEntry !== samlConfig?.product}
                onClick={deleteConfiguration}
                className='ml-1.5 bg-red-700 hover:bg-red-800 disabled:bg-slate-400 text-white text-sm font-bold py-2 px-4 rounded leading-6 inline-block'>
                Delete
              </button>
            </div>
          }>
          <p className='text-slate-600'>
            Please type in the name of the product &apos;
            {samlConfig?.product && <strong>{samlConfig.product}</strong>}&apos; to confirm.
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
