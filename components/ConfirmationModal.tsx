import Modal from './Modal';
import { useTranslation } from 'next-i18next';
import { ButtonOutline } from './ButtonOutline';
import { ButtonDanger } from './ButtonDanger';

const ConfirmationModal = (props: {
  visible: boolean;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  actionButtonText?: string;
}) => {
  const { visible, title, description, onConfirm, onCancel, actionButtonText } = props;
  const { t } = useTranslation('common');

  return (
    <Modal visible={visible} title={title} description={description}>
      <div className='modal-action'>
        <ButtonOutline onClick={onCancel}>{t('cancel')}</ButtonOutline>
        <ButtonDanger onClick={onConfirm} data-testid='confirm-delete'>
          {actionButtonText || t('delete')}
        </ButtonDanger>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
