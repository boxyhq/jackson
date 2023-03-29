import { FC, useState } from 'react';
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
  const [active, setActive] = useState<boolean | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  const askForConfirmation = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActive(e.target.checked);
    setModalVisible(true);
  };

  const onConfirm = () => {
    setModalVisible(false);

    if (active !== null) {
      onChange(active);
    }
  };

  const onCancel = () => {
    setModalVisible(false);
    setActive(null);
  };

  const confirmationModalTitle = active ? t('activate_connection') : t('deactivate_connection');

  const confirmationModalDescription = {
    sso: {
      activate: t('activate_sso_connection_description'),
      deactivate: t('deactivate_sso_connection_description'),
    },
    dsync: {
      activate: t('activate_dsync_connection_description'),
      deactivate: t('deactivate_dsync_connection_description'),
    },
  }[connection.type][active ? 'activate' : 'deactivate'];

  return (
    <>
      <label className='label cursor-pointer'>
        <span className='label-text mr-2'>{connection.active ? t('active') : t('inactive')}</span>
        <input
          type='checkbox'
          className='toggle-success toggle'
          onChange={askForConfirmation}
          checked={connection.active}
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
      />
    </>
  );
};
