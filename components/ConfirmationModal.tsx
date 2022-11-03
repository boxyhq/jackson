import Modal from './Modal';

const ConfirmationModal = (props: {
  visible: boolean;
  title: string;
  description: string;
  onConfirm: any;
  onCancel: any;
  actionButtonText?: string;
}) => {
  const { visible, title, description, onConfirm, onCancel, actionButtonText } = props;

  return (
    <Modal visible={visible} title={title} description={description}>
      <div className='modal-action'>
        <button className='btn btn-outline' onClick={onCancel}>
          Cancel
        </button>
        <button className='btn btn-error' onClick={onConfirm}>
          {actionButtonText || 'Delete'}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
