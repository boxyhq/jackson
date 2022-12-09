import Modal from './Modal';
import { useTranslation } from 'next-i18next';

const ConfirmationModal = (props: {
  visible: boolean;
  title: string;
  description: string;
  onConfirm: any;
  onCancel: any;
}) => {
  const { visible, title, description, onConfirm, onCancel } = props;
  const { t } = useTranslation('common');

  return (
    <Modal visible={visible} title={title} description={description}>
      <div className='modal-action'>
        <button className='btn btn-outline' onClick={onCancel}>
          {t('cancel')}
        </button>
        <button className='btn btn-error' onClick={onConfirm}>
          {t('delete')}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
