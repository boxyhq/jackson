import type { Directory } from '@boxyhq/saml-jackson';
import { errorToast, successToast } from '@components/Toaster';
import { FC, useState, useEffect } from 'react';
import type { ApiResponse } from 'types';
import { useTranslation } from 'next-i18next';
import { ConnectionToggle } from '@components/ConnectionToggle';

interface Props {
  connection: Directory;
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
      directoryId: connection.id,
      deactivated: !active,
    };

    const actionUrl = setupLinkToken
      ? `/api/setup/${setupLinkToken}/directory-sync/${connection.id}`
      : `/api/admin/directory-sync/${connection.id}`;

    const res = await fetch(actionUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

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
      <ConnectionToggle connection={{ active, type: 'dsync' }} onChange={updateConnectionStatus} />
    </>
  );
};
