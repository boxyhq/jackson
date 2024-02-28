import { useTranslation } from 'next-i18next';
import { Modal } from './Modal';
import { ButtonOutline } from './ButtonOutline';
import { ButtonDanger } from './ButtonDanger';
import { ButtonBase } from './ButtonBase';

export const ConfirmationModal = ({
  visible,
  title,
  description,
  onConfirm,
  onCancel,
  actionButtonText,
  dataTestId = 'confirm-delete',
  overrideDeleteButton = false,
}: {
  visible: boolean;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  actionButtonText?: string;
  overrideDeleteButton?: boolean;
  dataTestId?: string;
}) => {
  const { t } = useTranslation('common');

  const buttonText = actionButtonText || t('delete');

  return (
    <Modal visible={visible} title={title} description={description}>
      <div className='modal-action'>
        <ButtonOutline onClick={onCancel}>{t('cancel')}</ButtonOutline>
        {overrideDeleteButton ? (
          <ButtonBase color='secondary' onClick={onConfirm} data-testid={dataTestId}>
            {buttonText}
          </ButtonBase>
        ) : (
          <ButtonDanger onClick={onConfirm} data-testid={dataTestId}>
            {buttonText}
          </ButtonDanger>
        )}
      </div>
    </Modal>
  );
};
