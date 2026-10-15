import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMessageCircle, FiX, FiArrowLeft } from 'react-icons/fi';
import useChatbotTree from '../../hooks/useChatbotTree';
import { usePreferences } from '../../contexts/PreferencesContext';

/** Floating menu-driven assistant on the public site (button navigation only, no free text). */
const ChatbotWidget = () => {
  const { t } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const { path, menu, response, label, isLoading, select, goBack } = useChatbotTree({ enabled: isOpen, greeting: t('assistant.greeting') });

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition hover:bg-primary-700"
        aria-label={isOpen ? t('assistant.close') : t('assistant.open')}
      >
        {isOpen ? <FiX className="h-6 w-6" /> : <FiMessageCircle className="h-6 w-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="glass-card fixed bottom-24 right-6 z-40 flex h-[28rem] w-80 flex-col overflow-hidden bg-white dark:bg-gray-900"
          >
            <div className="flex items-center gap-2 bg-primary-600 px-4 py-3 text-white">
              {path.length > 0 && (
                <button onClick={goBack} aria-label={t('common.back')}>
                  <FiArrowLeft />
                </button>
              )}
              <p className="font-semibold">CiviCare Assistant</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 text-sm">
              <div className="mb-3 rounded-xl bg-gray-100 p-3 dark:bg-gray-800">{response}</div>
            </div>

            <div className="max-h-40 overflow-y-auto border-t border-gray-100 p-3 dark:border-gray-800">
              {isLoading ? (
                <p className="text-center text-xs text-gray-400">{t('common.loading')}</p>
              ) : menu.length ? (
                <div className="flex flex-wrap gap-2">
                  {menu.map((node) => (
                    <button
                      key={node._id}
                      onClick={() => select(node)}
                      className="rounded-full border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-50 dark:border-primary-800 dark:text-primary-400 dark:hover:bg-primary-500/10"
                    >
                      {label(node)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-gray-400">{t('assistant.noMoreWidget')}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
