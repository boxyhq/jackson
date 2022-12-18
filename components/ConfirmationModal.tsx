import Modal from './Modal';
import { useTranslation } from 'next-i18next';
import { Button } from './Button';

const ConfirmationModal = (props: {
  visible: boolean;
  title: string;
  description: string;
  onConfirm: any;
  onCancel: any;
  actionButtonText?: string;
}) => {
  const { visible, title, description, onConfirm, onCancel, actionButtonText } = props;
  const { t } = useTranslation('common');

  return (
    <Modal visible={visible} title={title} description={description}>
      <div className='modal-action'>
        <Button variant='outline' onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button color='error' onClick={onConfirm}>
          {actionButtonText || t('delete')}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
