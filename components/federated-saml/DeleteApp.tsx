import { useState } from 'react';
import toast from 'react-hot-toast';
import type { SAMLFederationApp } from '@boxyhq/saml-jackson';

import ConfirmationModal from '@components/ConfirmationModal';

export const DeleteApp = ({ app }: { app: SAMLFederationApp }) => {
  const [delModalVisible, setDelModalVisible] = useState(false);

  const deleteApp = async () => {
    const response = await fetch(`/api/admin/federated-saml/${app.id}`, {
      method: 'DELETE',
    });

    const { error } = await response.json();

    if (!response.ok) {
      toast.error(error.message);
    } else {
      toast.success('SAML federation app deleted successfully');
      window.location.href = '/admin/federated-saml';
    }
  };

  return (
    <>
      <section className='mt-5 flex items-center rounded bg-red-100 p-6 text-red-900'>
        <div className='flex-1'>
          <h6 className='mb-1 font-medium'>Delete this SAML Federation app</h6>
          <p className='font-light'>All your apps using this connection will stop working.</p>
        </div>
        <button
          type='button'
          className='btn-error btn'
          data-modal-toggle='popup-modal'
          onClick={() => {
            setDelModalVisible(true);
          }}>
          Delete
        </button>
      </section>
      <ConfirmationModal
        title='Delete the SAML Federation app?'
        description='This action cannot be undone. This will permanently delete the Connection.'
        visible={delModalVisible}
        onConfirm={deleteApp}
        onCancel={() => {
          setDelModalVisible(false);
        }}
      />
    </>
  );
};
