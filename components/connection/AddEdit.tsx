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
 * `accessor` only used to set initial state and retrieve saved value. Useful when key is different from retrieved payload.
 */
const fieldCatalog = [
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'MyApp',
    attributes: { required: false, requiredInEditView: false, visibleInSetupView: true },
  },
  {
    key: 'description',
    label: 'Description',
    type: 'text',
    placeholder: 'A short description not more than 100 characters',
    attributes: { maxLength: 100, required: false, requiredInEditView: false, visibleInSetupView: true }, // not required in create/edit view
  },
  {
    key: 'tenant',
    label: 'Tenant',
    type: 'text',
    placeholder: 'acme.com',
    attributes: { editable: false, visibleInSetupView: false },
  },
  {
    key: 'product',
    label: 'Product',
    type: 'text',
    placeholder: 'demo',
    attributes: { editable: false, visibleInSetupView: false },
  },
  {
    key: 'redirectUrl',
    label: 'Allowed redirect URLs (newline separated)',
    type: 'textarea',
    placeholder: 'http://localhost:3366',
    attributes: { isArray: true, rows: 3, visibleInSetupView: true },
  },
  {
    key: 'defaultRedirectUrl',
    label: 'Default redirect URL',
    type: 'url',
    placeholder: 'http://localhost:3366/login/saml',
    attributes: { visibleInSetupView: true },
  },
  {
    key: 'oidcDiscoveryUrl',
    label: 'Well-known URL of OpenId Provider',
    type: 'url',
    placeholder: 'https://example.com/.well-known/openid-configuration',
    attributes: { connection: 'oidc', accessor: (o) => o?.oidcProvider?.discoveryUrl, visibleInSetupView: true },
  },
  {
    key: 'oidcClientId',
    label: 'Client ID [OIDC Provider]',
    type: 'text',
    placeholder: '',
    attributes: { editable: false, connection: 'oidc', accessor: (o) => o?.oidcProvider?.clientId, visibleInSetupView: true },
  },
  {
    key: 'oidcClientSecret',
    label: 'Client Secret [OIDC Provider]',
    type: 'text',
    placeholder: '',
    attributes: { connection: 'oidc', accessor: (o) => o?.oidcProvider?.clientSecret, visibleInSetupView: true },
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
      connection: 'saml', visibleInSetupView: true
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
      connection: 'saml', visibleInSetupView: true,
      formatForDisplay: (value) => {
        const obj = JSON.parse(JSON.stringify(value));
        delete obj.validTo;
        return JSON.stringify(obj, null, 2);
      },
    },
  },
  {
    key: 'idpCertExpiry',
    label: 'IdP Certificate Validity',
    type: 'pre',
    attributes: {
      isHidden: (value): boolean => !value.validTo || new Date(value.validTo).toString() == 'Invalid Date',
      rows: 10,
      editable: false,
      showOnlyInEditView: true,
      connection: 'saml',
      accessor: (o) => o?.idpMetadata?.validTo,
      showWarning: (value) => new Date(value) < new Date(),
      formatForDisplay: (value) => new Date(value).toString(),
      visibleInSetupView: true
    },
  },
  {
    key: 'clientID',
    label: 'Client ID',
    type: 'text',
    attributes: { showOnlyInEditView: true, editable: false, visibleInSetupView: true },
  },
  {
    key: 'clientSecret',
    label: 'Client Secret',
    type: 'password',
    attributes: { showOnlyInEditView: true, editable: false, visibleInSetupView: true },
  },
  {
    key: 'forceAuthn',
    label: 'Force Authentication',
    type: 'checkbox',
    attributes: { requiredInEditView: false, required: false, connection: 'saml', visibleInSetupView: true },
  },
];

function getFieldList(isEditView) {
  return isEditView
    ? fieldCatalog
    : fieldCatalog.filter(({ attributes: { showOnlyInEditView } }) => !showOnlyInEditView); // filtered list for add view
}

function getInitialState(connection, isEditView) {
  const _state = {};
  const _fieldCatalog = getFieldList(isEditView);

  _fieldCatalog.forEach(({ key, attributes }) => {
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

type AddEditProps = {
  connection?: Record<string, any>;
  setup?: Record<string, any>;
};

const AddEdit = ({ connection, setup }: AddEditProps) => {
  const router = useRouter();
  // STATE: New connection type
  const [newConnectionType, setNewConnectionType] = useState<'saml' | 'oidc'>('saml');
  const handleNewConnectionTypeChange = (event) => {
    setNewConnectionType(event.target.value);
  };

  const { id: connectionClientId } = router.query;
  const isEditView = !!connection && !!connectionClientId;
  const connectionIsSAML = isEditView
    ? connection?.idpMetadata && typeof connection.idpMetadata === 'object'
    : newConnectionType === 'saml';
  const connectionIsOIDC = isEditView
    ? connection?.oidcProvider && typeof connection.oidcProvider === 'object'
    : newConnectionType === 'oidc';
  // FORM LOGIC: SUBMIT
  const [{ status }, setSaveStatus] = useState<{ status: 'UNKNOWN' | 'SUCCESS' | 'ERROR' }>({
    status: 'UNKNOWN',
  });
  const saveConnection = async (event) => {
    event.preventDefault();
    const { rawMetadata, redirectUrl, oidcDiscoveryUrl, oidcClientId, oidcClientSecret, ...rest } = formObj;
    const encodedRawMetadata = btoa(rawMetadata || '');
    const redirectUrlList = redirectUrl.split(/\r\n|\r|\n/);

    const res = await fetch(setup ? `/api/setup/${setup.token}/connections` : '/api/admin/connections', {
      method: isEditView ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...rest,
        encodedRawMetadata: connectionIsSAML ? encodedRawMetadata : undefined,
        oidcDiscoveryUrl: connectionIsOIDC ? oidcDiscoveryUrl : undefined,
        oidcClientId: connectionIsOIDC ? oidcClientId : undefined,
        oidcClientSecret: connectionIsOIDC ? oidcClientSecret : undefined,
        redirectUrl: JSON.stringify(redirectUrlList),
      }),
    });
    if (res.ok) {
      if (!isEditView) {
        router.replace(setup ? `/setup/${setup.token}/connection` : '/admin/connection');
      } else {
        setSaveStatus({ status: 'SUCCESS' });
        // revalidate on save
        mutate(setup ? `/api/setup/${setup.token}/connections` : `/api/admin/connections/${connectionClientId}`);
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
  const deleteConnection = async () => {
    await fetch(setup ? `/api/setup/${setup.token}/connections` : '/api/admin/connections', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientID: connection?.clientID, clientSecret: connection?.clientSecret }),
    });
    toggleDelConfirm();
    await mutate(setup ? `/api/setup/${setup.token}/connections` : '/api/admin/connections');
    router.replace(setup ? `/setup/${setup.token}/connection` : '/admin/connection');
  };

  // STATE: FORM
  const [formObj, setFormObj] = useState<Record<string, string>>(() =>
    getInitialState(connection, isEditView)
  );
  // Resync form state on save
  useEffect(() => {
    const _state = getInitialState(connection, isEditView);
    setFormObj(_state);
  }, [connection, isEditView]);

  function getHandleChange(opts: any = {}) {
    return (event: FormEvent) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      setFormObj((cur) => ({ ...cur, [target.id]: target[opts.key || 'value'] }));
    };
  }

  function fieldCatalogFilterByConnection(connection) {
    return ({ attributes }) =>
      attributes.connection && connection !== null ? attributes.connection === connection : true;
  }

  return (
    <>
      <Link href={setup ? `/setup/${setup.token}` : '/admin/connection'}>
        <a className='btn btn-outline items-center space-x-2'>
          <ArrowLeftIcon aria-hidden className='h-4 w-4' />
          <span>Back</span>
        </a>
      </Link>
      <div>
        <h2 className='mb-5 mt-5 font-bold text-gray-700 dark:text-white md:text-xl'>
          {isEditView ? 'Edit Connection' : 'Create Connection'}
        </h2>
        {!isEditView && (
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
        )}
        <form onSubmit={saveConnection}>
          <div className='min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
            {fieldCatalog
              .filter(
                fieldCatalogFilterByConnection(
                  isEditView
                    ? connectionIsSAML
                      ? 'saml'
                      : connectionIsOIDC
                      ? 'oidc'
                      : null
                    : newConnectionType
                )
              )
              .filter(({ attributes: { visibleInSetupView } }) => (setup ? visibleInSetupView : true))
              .filter(({ attributes: { showOnlyInEditView } }) => (isEditView ? true : !showOnlyInEditView))
              .map(
                ({
                  key,
                  placeholder,
                  label,
                  type,
                  attributes: {
                    isHidden,
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
                      {type !== 'checkbox' && (
                        <label
                          htmlFor={key}
                          className={`mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300 ${
                            isHidden ? (isHidden(formObj[key]) == true ? 'hidden' : '') : ''
                          }`}>
                          {_label}
                        </label>
                      )}
                      {type === 'pre' ? (
                        <pre
                          className={`block w-full overflow-auto rounded-lg border border-gray-300 bg-gray-50 p-2 
                        text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 
                        dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 
                        dark:focus:ring-blue-500 ${
                          isHidden ? (isHidden(formObj[key]) == true ? 'hidden' : '') : ''
                        } ${
                            showWarning ? (showWarning(formObj[key]) ? 'border-2 border-rose-500' : '') : ''
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
                          onChange={getHandleChange()}
                          className={`textarea textarea-bordered h-24 w-full ${
                            isArray ? 'whitespace-pre' : ''
                          }`}
                          rows={rows}
                        />
                      ) : type === 'checkbox' ? (
                        <>
                          <label
                            htmlFor={key}
                            className='inline-block align-middle text-sm font-medium text-gray-900 dark:text-gray-300'>
                            {_label}
                          </label>
                          <input
                            id={key}
                            type={type}
                            checked={!!value}
                            required={_required}
                            readOnly={readOnly}
                            maxLength={maxLength}
                            onChange={getHandleChange({ key: 'checked' })}
                            className='checkbox checkbox-primary ml-5 align-middle'
                          />
                        </>
                      ) : (
                        <input
                          id={key}
                          type={type}
                          placeholder={placeholder}
                          value={value}
                          required={_required}
                          readOnly={readOnly}
                          maxLength={maxLength}
                          onChange={getHandleChange()}
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
          {connection?.clientID && connection.clientSecret && (
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
          title='Delete the Connection'
          description='This action cannot be undone. This will permanently delete the Connection.'
          visible={delModalVisible}
          onConfirm={deleteConnection}
          onCancel={toggleDelConfirm}></ConfirmationModal>
      </div>
    </>
  );
};

export default AddEdit;
