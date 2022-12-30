import { useTranslation } from 'next-i18next';
import { useState, useEffect } from 'react';
import { SetupLink } from '@boxyhq/saml-jackson';
import Modal from '@components/Modal';
import { ButtonOutline } from '@components/ButtonOutline';
import { InputWithCopyButton } from '@components/ClipboardButton';

export const SetupLinkInfo = ({ setupLink, visible }: { setupLink: SetupLink; visible: boolean }) => {
  const { t } = useTranslation();
  const [visibleModal, setVisibleModal] = useState(visible);

  useEffect(() => {
    setVisibleModal(visible);
  }, [visible]);

  return (
    <Modal visible={visibleModal} title={`Setup link info for the tenant ${setupLink.tenant}`}>
      <div className='mt-2 flex flex-col gap-3'>
        <div>
          <InputWithCopyButton
            text={setupLink.url}
            label='Share this link with your customer to setup their service'
          />
        </div>
        <p className='text-sm'>
          This link is valid till{' '}
          <span className='font-medium'>{new Date(setupLink.validTill).toString()}</span>.
        </p>
      </div>
      <div className='modal-action'>
        <ButtonOutline
          onClick={() => {
            setVisibleModal(false);
          }}>
          {t('close')}
        </ButtonOutline>
      </div>
    </Modal>
  );
};
