import type { OIDCSSORecord, SAMLSSORecord } from '@boxyhq/saml-jackson';
import { errorToast, successToast } from '@components/Toaster';
import { FC, useState } from 'react';
import type { ApiResponse } from 'types';
import { useTranslation } from 'next-i18next';
import { isConnectionActive } from '@lib/utils';
import { ConnectionToggle } from '@components/ConnectionToggle';

interface Props {
  connection: SAMLSSORecord | OIDCSSORecord;
  setupLinkToken?: string;
}

export const ToggleConnectionStatus: FC<Props> = (props) => {
  const { connection, setupLinkToken } = props;

  const { t } = useTranslation('common');
  const [status, setStatus] = useState(isConnectionActive(connection));

  const updateConnectionStatus = async (active: boolean) => {
    setStatus(active);

    const body = {
      clientID: connection?.clientID,
      clientSecret: connection?.clientSecret,
      tenant: connection?.tenant,
      product: connection?.product,
      deactivated: status,
    };

    if ('idpMetadata' in connection) {
      body['isSAML'] = true;
    } else {
      body['isOIDC'] = true;
    }

    const res = await fetch(
      setupLinkToken ? `/api/setup/${setupLinkToken}/sso-connection` : '/api/admin/connections',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const response: ApiResponse = await res.json();

    if ('error' in response) {
      errorToast(response.error.message);
      return;
    }

    if (body.deactivated) {
      successToast(t('connection_deactivated'));
    } else {
      successToast(t('connection_activated'));
    }
  };

  return (
    <>
      <ConnectionToggle onChange={updateConnectionStatus} connection={{ active: status, type: 'sso' }} />
    </>
  );
};
