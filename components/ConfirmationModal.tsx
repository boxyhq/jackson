import Modal from './Modal';
import { useTranslation } from 'next-i18next';
import { ButtonOutline } from './ButtonOutline';
import { ButtonDanger } from './ButtonDanger';
import { ButtonBase } from './ButtonBase';

const ConfirmationModal = (props: {
  visible: boolean;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  actionButtonText?: string;
  overrideDeleteButton?: boolean;
}) => {
  const { visible, title, description, onConfirm, onCancel, actionButtonText } = props;
  const { t } = useTranslation('common');

  let button;
  if (props.overrideDeleteButton) {
    button = (
      <ButtonBase color='secondary' onClick={onConfirm} data-testid='confirm-delete'>
        {actionButtonText || t('delete')}
      </ButtonBase>
    );
  } else {
    button = (
      <ButtonDanger onClick={onConfirm} data-testid='confirm-delete'>
        {actionButtonText || t('delete')}
      </ButtonDanger>
    );
  }

  return (
    <Modal visible={visible} title={title} description={description}>
      <div className='modal-action'>
        <ButtonOutline onClick={onCancel}>{t('cancel')}</ButtonOutline>
        {button}
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
