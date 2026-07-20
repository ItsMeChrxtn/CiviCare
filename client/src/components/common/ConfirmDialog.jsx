import Modal from './Modal';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = false, loading = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    <div className="mt-6 flex justify-end gap-3">
      <button onClick={onClose} className="btn-secondary" disabled={loading}>
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className={`btn-primary ${danger ? '!bg-red-600 hover:!bg-red-700' : ''}`}
      >
        {loading ? 'Please wait...' : confirmLabel}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
