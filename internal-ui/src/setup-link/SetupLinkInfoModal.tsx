import { Button } from 'react-daisyui';
import { useTranslation } from 'next-i18next';

import { Modal } from '../shared';
import type { SetupLink } from '../types';
import { InputWithCopyButton } from '../shared/InputWithCopyButton';

export const SetupLinkInfoModal = ({
  setupLink,
  visible,
  onClose,
}: {
  setupLink: SetupLink;
  visible: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation('common');

  const expiresAt = new Date(setupLink.validTill).toUTCString();
  const isExpired = new Date(setupLink.validTill) < new Date();

  return (
    <Modal visible={visible} title={`Setup Link for ${setupLink.tenant}`}>
      <div className='pt-3'>
        <InputWithCopyButton
          label='Share this link with your customer to setup their service'
          text={setupLink.url}
        />
      </div>
      {!isExpired ? (
        <p className='text-sm text-gray-500 mt-3'>{`This link will expire on ${expiresAt}.`}</p>
      ) : (
        <p>This link has expired</p>
      )}
      <div className='modal-action'>
        <Button color='secondary' variant='outline' type='button' size='md' onClick={() => onClose()}>
          {t('close')}
        </Button>
      </div>
    </Modal>
  );
};
