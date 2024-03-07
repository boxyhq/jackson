import type { OIDCSSORecord, SAMLSSORecord } from '@boxyhq/saml-jackson';
import { errorToast, successToast } from '@components/Toaster';
import { FC, useEffect, useState } from 'react';
import type { ApiResponse } from 'types';
import { useTranslation } from 'next-i18next';
import { ConnectionToggle } from '@components/ConnectionToggle';

interface Props {
  connection: SAMLSSORecord | OIDCSSORecord;
  setupLinkToken?: string;
}

export const ToggleConnectionStatus: FC<Props> = (props) => {
  const { connection, setupLinkToken } = props;

  const { t } = useTranslation('common');
  const [active, setActive] = useState(!connection.deactivated);

  useEffect(() => {
    setActive(!connection.deactivated);
  }, [connection]);

  const updateConnectionStatus = async (active: boolean) => {
    setActive(active);

    const body = {
      clientID: connection?.clientID,
      clientSecret: connection?.clientSecret,
      tenant: connection?.tenant,
      product: connection?.product,
      deactivated: !active,
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

    if (!res.ok) {
      const response: ApiResponse = await res.json();

      if ('error' in response) {
        errorToast(response.error.message);
      }

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
      <ConnectionToggle connection={{ active, type: 'sso' }} onChange={updateConnectionStatus} />
    </>
  );
};
