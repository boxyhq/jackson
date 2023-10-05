import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { mutate } from 'swr';

import ConfirmationModal from '@components/ConfirmationModal';
import {
  saveConnection,
  fieldCatalogFilterByConnection,
  renderFieldList,
  useFieldCatalog,
  type FormObj,
  type FieldCatalogItem,
  excludeFallback,
} from './utils';
import { ApiResponse } from 'types';
import { errorToast, successToast } from '@components/Toaster';
import { useTranslation } from 'next-i18next';
import { LinkBack } from '@components/LinkBack';
import { ButtonPrimary } from '@components/ButtonPrimary';
import { ButtonDanger } from '@components/ButtonDanger';
import { isObjectEmpty } from '@lib/ui/utils';
import { ToggleConnectionStatus } from './ToggleConnectionStatus';
import type { OIDCSSORecord, SAMLSSORecord } from '@boxyhq/saml-jackson';

function getInitialState(connection, fieldCatalog: FieldCatalogItem[], connectionType) {
  const _state = {};

  fieldCatalog.forEach(({ key, attributes, type, members }) => {
    let value;
    if (attributes.connection && attributes.connection !== connectionType) {
      return;
    }
    if (type === 'object') {
      value = getInitialState(connection, members as FieldCatalogItem[], connectionType);
      if (isObjectEmpty(value)) {
        return;
      }
    } else if (typeof attributes.accessor === 'function') {
      if (attributes.accessor(connection) === undefined) {
        return;
      }
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
  connection: SAMLSSORecord | OIDCSSORecord;
  setupLinkToken?: string;
  isSettingsView?: boolean;
};

const EditConnection = ({ connection, setupLinkToken, isSettingsView = false }: EditProps) => {
  const fieldCatalog = useFieldCatalog({ isEditView: true, isSettingsView });

  const router = useRouter();
  const { t } = useTranslation('common');

  const { id: connectionClientId } = router.query;

  const connectionIsSAML = 'idpMetadata' in connection && typeof connection.idpMetadata === 'object';
  const connectionIsOIDC = 'oidcProvider' in connection && typeof connection.oidcProvider === 'object';

  // FORM LOGIC: SUBMIT
  const save = async (event) => {
    event.preventDefault();
    saveConnection({
      formObj: formObj,
      connectionIsSAML: connectionIsSAML,
      connectionIsOIDC: connectionIsOIDC,
      isEditView: true,
      setupLinkToken,
      callback: async (res) => {
        if (res.ok) {
          successToast(t('saved'));
          // revalidate on save
          mutate(
            setupLinkToken
              ? `/api/setup/${setupLinkToken}/sso-connection`
              : `/api/admin/connections/${connectionClientId}`
          );
          return;
        }

        const response: ApiResponse = await res.json();

        if ('error' in response) {
          errorToast(response.error.message);
          return;
        }
      },
    });
  };

  // LOGIC: DELETE
  const [delModalVisible, setDelModalVisible] = useState(false);
  const toggleDelConfirm = () => setDelModalVisible(!delModalVisible);
  const deleteConnection = async () => {
    const queryParams = new URLSearchParams({
      clientID: connection.clientID,
      clientSecret: connection.clientSecret,
    });
    const res = await fetch(
      setupLinkToken
        ? `/api/setup/${setupLinkToken}/sso-connection?${queryParams}`
        : `/api/admin/connections?${queryParams}`,
      {
        method: 'DELETE',
      }
    );

    const response: ApiResponse = await res.json();

    toggleDelConfirm();

    if ('error' in response) {
      errorToast(response.error.message);
      return;
    }

    if (res.ok) {
      await mutate(
        setupLinkToken
          ? `/api/setup/${setupLinkToken}/connections`
          : isSettingsView
          ? `/api/admin/connections?isSystemSSO`
          : '/api/admin/connections'
      );
      router.replace(
        setupLinkToken
          ? `/setup/${setupLinkToken}/sso-connection`
          : isSettingsView
          ? '/admin/settings/sso-connection'
          : '/admin/sso-connection'
      );
    }
  };

  const connectionType = connectionIsSAML ? 'saml' : connectionIsOIDC ? 'oidc' : null;

  // STATE: FORM
  const [formObj, setFormObj] = useState<FormObj>(() =>
    getInitialState(connection, fieldCatalog, connectionType)
  );
  // Resync form state on save
  useEffect(() => {
    const _state = getInitialState(connection, fieldCatalog, connectionType);
    setFormObj(_state);
  }, [connection, fieldCatalog, connectionType]);

  const filteredFieldsByConnection = fieldCatalog.filter(fieldCatalogFilterByConnection(connectionType));

  const activateFallback = (activeKey, fallbackKey) => {
    setFormObj((cur) => {
      const temp = { ...cur };
      delete temp[activeKey];
      const fallbackItem = fieldCatalog.find(({ key }) => key === fallbackKey);
      const fallbackItemVal = fallbackItem?.type === 'object' ? {} : '';
      return { ...temp, [fallbackKey]: fallbackItemVal };
    });
  };

  const backUrl = setupLinkToken
    ? `/setup/${setupLinkToken}`
    : isSettingsView
    ? '/admin/settings/sso-connection'
    : '/admin/sso-connection';

  return (
    <>
      <LinkBack href={backUrl} />
      <div>
        <div className='flex items-center justify-between'>
          <h2 className='mb-5 mt-5 font-bold text-gray-700 dark:text-white md:text-xl'>
            {t('edit_sso_connection')}
          </h2>
          <ToggleConnectionStatus connection={connection} setupLinkToken={setupLinkToken} />
        </div>
        <form onSubmit={save}>
          <div className='min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 lg:border-none lg:p-0'>
            <div className='flex flex-col gap-0 lg:flex-row lg:gap-4'>
              <div className='w-full rounded border-gray-200 dark:border-gray-700 lg:w-3/5 lg:border lg:p-3'>
                {filteredFieldsByConnection
                  .filter((field) => field.attributes.editable !== false)
                  .filter(({ attributes: { hideInSetupView } }) => (setupLinkToken ? !hideInSetupView : true))
                  .filter(excludeFallback(formObj))
                  .map(renderFieldList({ isEditView: true, formObj, setFormObj, activateFallback }))}
              </div>
              <div className='w-full rounded border-gray-200 dark:border-gray-700 lg:w-2/5 lg:border lg:p-3'>
                {filteredFieldsByConnection
                  .filter((field) => field.attributes.editable === false)
                  .filter(({ attributes: { hideInSetupView } }) => (setupLinkToken ? !hideInSetupView : true))
                  .filter(excludeFallback(formObj))
                  .map(renderFieldList({ isEditView: true, formObj, setFormObj, activateFallback }))}
              </div>
            </div>
            <div className='flex w-full lg:mt-6'>
              <ButtonPrimary type='submit'>{t('save_changes')}</ButtonPrimary>
            </div>
          </div>
          {connection?.clientID && connection.clientSecret && (
            <section className='mt-10 flex items-center rounded bg-red-100 p-6 text-red-900'>
              <div className='flex-1'>
                <h6 className='mb-1 font-medium'>{t('delete_this_connection')}</h6>
                <p className='font-light'>{t('all_your_apps_using_this_connection_will_stop_working')}</p>
              </div>
              <ButtonDanger
                type='button'
                onClick={toggleDelConfirm}
                data-modal-toggle='popup-modal'
                data-testid='delete-connection'>
                {t('delete')}
              </ButtonDanger>
            </section>
          )}
        </form>
        <ConfirmationModal
          title={t('delete_the_connection')}
          description={t('confirmation_modal_description')}
          visible={delModalVisible}
          onConfirm={deleteConnection}
          onCancel={toggleDelConfirm}
        />
      </div>
    </>
  );
};

export default EditConnection;
