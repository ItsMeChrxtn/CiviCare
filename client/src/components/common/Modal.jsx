import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`w-full ${widths[size]} max-h-[92vh] overflow-y-auto rounded-t-3xl border border-gray-200/70 bg-white p-5 shadow-card-hover dark:border-gray-800 dark:bg-gray-900 sm:max-h-[90vh] sm:rounded-2xl sm:p-6`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle so the bottom sheet reads as one on phones */}
            <div className="mx-auto -mt-1 mb-3 h-1.5 w-10 rounded-full bg-gray-200 dark:bg-gray-700 sm:hidden" />
            <div className="sticky -top-5 z-10 -mx-5 mb-4 flex items-center justify-between gap-3 bg-white px-5 pb-2 pt-1 dark:bg-gray-900 sm:static sm:mx-0 sm:p-0">
              <h3 className="font-display text-lg font-bold tracking-tight">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
