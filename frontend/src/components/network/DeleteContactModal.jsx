import React from 'react';
import DeleteConfirmationModal from '../resume/DeleteConfirmationModal';

export default function DeleteContactModal({ showModal, contact, onClose, onConfirm, isDeleting }) {
  const itemDetails = {
    name: contact?.firstName ? `${contact.firstName} ${contact.lastName}` : contact?.name || '',
    subtitle: contact?.company || ''
  };

  return (
    <DeleteConfirmationModal
      showModal={showModal}
      itemToDelete={contact}
      itemType="contact"
      itemDetails={itemDetails}
      onClose={onClose}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
    />
  );
}
