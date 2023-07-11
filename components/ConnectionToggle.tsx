import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import ConfirmationModal from '@components/ConfirmationModal';

interface Props {
  onChange: (active: boolean) => void;
  connection: {
    active: boolean;
    type: 'sso' | 'dsync';
  };
}

export const ConnectionToggle: FC<Props> = (props) => {
  const { onChange, connection } = props;

  const { t } = useTranslation('common');
  const [isModalVisible, setModalVisible] = useState(false);
  const [active, setActive] = useState(connection.active);

  useEffect(() => {
    setActive(connection.active);
  }, [connection]);

  const askForConfirmation = () => {
    setModalVisible(true);
  };

  const onConfirm = () => {
    setModalVisible(false);
    setActive(!active);
    onChange(!active);
  };

  const onCancel = () => {
    setModalVisible(false);
  };

  const confirmationModalTitle = active ? t('deactivate_connection') : t('activate_connection');

  const confirmationModalDescription = {
    sso: {
      activate: t('activate_sso_connection_description'),
      deactivate: t('deactivate_sso_connection_description'),
    },
    dsync: {
      activate: t('activate_dsync_connection_description'),
      deactivate: t('deactivate_dsync_connection_description'),
    },
  }[connection.type][active ? 'deactivate' : 'activate'];

  return (
    <>
      <label className='label cursor-pointer'>
        <span className='label-text mr-2'>{active ? t('active') : t('inactive')}</span>
        <input
          type='checkbox'
          className='toggle-success toggle'
          onChange={askForConfirmation}
          checked={active}
        />
      </label>
      <ConfirmationModal
        title={confirmationModalTitle}
        description={confirmationModalDescription}
        actionButtonText={t('yes_proceed')}
        overrideDeleteButton={true}
        visible={isModalVisible}
        onConfirm={onConfirm}
        onCancel={onCancel}
        dataTestId='confirm-connection-toggle'
      />
    </>
  );
};
