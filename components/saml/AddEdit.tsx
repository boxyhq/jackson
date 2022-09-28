import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import { mutate } from 'swr';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

import ConfirmationModal from '@components/ConfirmationModal';

/**
 * Edit view will have extra fields (showOnlyInEditView: true)
 * to render parsed metadata and other attributes.
 * All fields are editable unless they have `editable` set to false.
 * All fields are required unless they have `required` or `requiredInEditView` set to false.
 */
const fieldCatalog = [
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'MyApp',
    attributes: { required: false, requiredInEditView: false },
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
    placeholder: 'http://localhost:3366',
    attributes: { isArray: true, rows: 3 },
  },
  {
    key: 'defaultRedirectUrl',
    label: 'Default redirect URL',
    type: 'url',
    placeholder: 'http://localhost:3366/login/saml',
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
    label: 'IdP Metadata',
    type: 'pre',
    attributes: {
      rows: 10,
      editable: false,
      showOnlyInEditView: true,
      formatForDisplay: (value) => {
        const obj = JSON.parse(JSON.stringify(value));
        delete obj.validTo;
        return JSON.stringify(obj, null, 2)
      },
    },
  },
  {
    key: 'idpMetadata',
    label: 'IdP Certificate Validity',
    type: 'pre',
    attributes: {
      rows: 10,
      editable: false,
      showOnlyInEditView: true,
      showWarning: (value) => new Date(value.validTo) < new Date(),
      formatForDisplay: (value) => new Date(value.validTo).toString(),
    },
  },
  {
    key: 'clientID',
    label: 'Client ID',
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
  const deleteConfiguration = async () => {
    await fetch('/api/admin/saml/config', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
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
  // Resync form state on save
  useEffect(() => {
    const _state = getInitialState(samlConfig, isEditView);
    setFormObj(_state);
  }, [samlConfig, isEditView]);

  function handleChange(event: FormEvent) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    setFormObj((cur) => ({ ...cur, [target.id]: target.value }));
  }

  return (
    <>
      <Link href='/admin/saml/config'>
        <a className='btn btn-outline items-center space-x-2'>
          <ArrowLeftIcon aria-hidden className='h-4 w-4' />
          <span>Back</span>
        </a>
      </Link>
      <div>
        <h2 className='mb-5 mt-5 font-bold text-gray-700 dark:text-white md:text-xl'>
          {isEditView ? 'Edit Connection' : 'Create Connection'}
        </h2>
        <form onSubmit={saveSAMLConfiguration}>
          <div className='min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
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
                    showWarning,
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
                        className='mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300'>
                        {_label}
                      </label>
                      {type === 'pre' ? (
                        <pre
                          className={`block w-full overflow-auto rounded-lg border border-gray-300 bg-gray-50 p-2 
                        text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 
                        dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 
                        dark:focus:ring-blue-500 ${
                          showWarning ? (showWarning(value) ? 'border-2 border-rose-500' : '') : ''
                        }`}>
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
                          className={`textarea textarea-bordered h-24 w-full ${
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
                          className='input input-bordered w-full'
                        />
                      )}
                    </div>
                  );
                }
              )}
            <div className='flex'>
              <button type='submit' className='btn btn-primary'>
                Save Changes
              </button>
              <p
                role='status'
                className={`ml-2 inline-flex items-center ${
                  status === 'SUCCESS' || status === 'ERROR' ? 'opacity-100' : 'opacity-0'
                } transition-opacity motion-reduce:transition-none`}>
                {status === 'SUCCESS' && (
                  <span className='inline-flex items-center text-primary'>
                    <CheckCircleIcon aria-hidden className='mr-1 h-5 w-5'></CheckCircleIcon>
                    Saved
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
            </div>
          </div>
          {samlConfig?.clientID && samlConfig.clientSecret && (
            <section className='mt-10 flex items-center rounded bg-red-100 p-6 text-red-900'>
              <div className='flex-1'>
                <h6 className='mb-1 font-medium'>Delete this connection</h6>
                <p className='font-light'>All your apps using this connection will stop working.</p>
              </div>
              <button
                type='button'
                className='btn btn-error'
                onClick={toggleDelConfirm}
                data-modal-toggle='popup-modal'>
                Delete
              </button>
            </section>
          )}
        </form>
        <ConfirmationModal
          title='Delete the SAML Connection'
          description='This action cannot be undone. This will permanently delete the SAML config.'
          visible={delModalVisible}
          onConfirm={deleteConfiguration}
          onCancel={toggleDelConfirm}></ConfirmationModal>
      </div>
    </>
  );
};

export default AddEdit;
