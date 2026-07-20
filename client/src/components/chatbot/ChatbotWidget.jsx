import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMessageCircle, FiX, FiArrowLeft } from 'react-icons/fi';
import api from '../../utils/api';

/**
 * Rule-based, button-navigation chatbot (no AI/free text). Walks the
 * admin-managed Chatbot tree: fetch top-level topics, on select show the
 * node's canned response plus any of its child topics as new buttons.
 */
const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState([{ label: 'Main Menu', parent: null }]);
  const [menu, setMenu] = useState([]);
  const [activeResponse, setActiveResponse] = useState(
    "Hi! I'm the CiviCare Assistant. Choose a topic below to get started."
  );
  const [isLoading, setIsLoading] = useState(false);

  const current = history[history.length - 1];

  const loadMenu = async (parent) => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/chatbot/menu', { params: { parent: parent || 'null' } });
      setMenu(data.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadMenu(current.parent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, current.parent]);

  const selectNode = async (node) => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/chatbot/node/${node._id}`);
      setActiveResponse(data.data.response);
      setMenu(data.data.children);
      setHistory((prev) => [...prev, { label: node.label, parent: node._id }]);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setActiveResponse("Hi! I'm the CiviCare Assistant. Choose a topic below to get started.");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition hover:bg-primary-700"
        aria-label="Open chatbot"
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
              {history.length > 1 && (
                <button onClick={goBack} aria-label="Back">
                  <FiArrowLeft />
                </button>
              )}
              <p className="font-semibold">CiviCare Assistant</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 text-sm">
              <div className="mb-3 rounded-xl bg-gray-100 p-3 dark:bg-gray-800">{activeResponse}</div>
            </div>

            <div className="max-h-40 overflow-y-auto border-t border-gray-100 p-3 dark:border-gray-800">
              {isLoading ? (
                <p className="text-center text-xs text-gray-400">Loading...</p>
              ) : menu.length ? (
                <div className="flex flex-wrap gap-2">
                  {menu.map((node) => (
                    <button
                      key={node._id}
                      onClick={() => selectNode(node)}
                      className="rounded-full border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-50 dark:border-primary-800 dark:text-primary-400 dark:hover:bg-primary-500/10"
                    >
                      {node.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-gray-400">No more topics. Use the back arrow to go up.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
