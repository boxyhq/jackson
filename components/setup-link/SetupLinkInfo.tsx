import { useTranslation } from 'next-i18next';
import { SetupLink } from '@boxyhq/saml-jackson';
import Modal from '@components/Modal';
import { ButtonOutline } from '@components/ButtonOutline';
import { InputWithCopyButton } from '@components/ClipboardButton';

type SetupLinkInfoProps = {
  setupLink: SetupLink | null;
  visible: boolean;
  onClose: () => void;
};

export const SetupLinkInfo = ({ setupLink, visible, onClose }: SetupLinkInfoProps) => {
  const { t } = useTranslation();

  if (!setupLink) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      title={`Setup link info: tenant '${setupLink.tenant}', product '${setupLink.product}'`}>
      <div className='mt-2 flex flex-col gap-3'>
        <div>
          <InputWithCopyButton text={setupLink.url} label={t('share_setup_link')} />
        </div>
        <p className='text-sm'>
          {t('setup_link_valid_till')}{' '}
          <span className={new Date(setupLink.validTill) < new Date() ? 'text-red-400' : ''}>
            {new Date(setupLink.validTill).toString()}
          </span>
        </p>
      </div>
      <div className='modal-action'>
        <ButtonOutline onClick={onClose}>{t('close')}</ButtonOutline>
      </div>
    </Modal>
  );
};
