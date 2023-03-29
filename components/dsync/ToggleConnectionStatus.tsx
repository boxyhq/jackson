import type { Directory } from '@boxyhq/saml-jackson';
import { errorToast, successToast } from '@components/Toaster';
import { FC, useState } from 'react';
import type { ApiResponse } from 'types';
import { useTranslation } from 'next-i18next';
import { isConnectionActive } from '@lib/utils';
import { ConnectionToggle } from '@components/ConnectionToggle';

interface Props {
  connection: Directory;
  setupLinkToken?: string;
}

export const ToggleConnectionStatus: FC<Props> = (props) => {
  const { connection, setupLinkToken } = props;

  const { t } = useTranslation('common');
  const [status, setStatus] = useState(isConnectionActive(connection));

  const updateConnectionStatus = async (active: boolean) => {
    setStatus(active);

    const body = {
      directoryId: connection.id,
      deactivated: status,
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
      <ConnectionToggle onChange={updateConnectionStatus} connection={{ active: status, type: 'dsync' }} />
    </>
  );
};
