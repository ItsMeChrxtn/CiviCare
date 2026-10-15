import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';
import { usePreferences } from '../contexts/PreferencesContext';

/**
 * Walks the admin-managed, rule-based chatbot decision tree (no free text / NLP):
 * top-level buttons -> selecting one shows its canned answer and its children as the next buttons.
 * Labels and answers follow the EN/TL language toggle, falling back to English when no Tagalog text exists.
 */
const useChatbotTree = ({ enabled = true, greeting = '' } = {}) => {
  const { lang } = usePreferences();
  const [path, setPath] = useState([]); // selected nodes, root -> current
  const [menu, setMenu] = useState([]);
  const [current, setCurrent] = useState(null); // node whose answer is shown
  const [isLoading, setIsLoading] = useState(false);

  const label = useCallback((node) => (lang === 'tl' && node?.labelTl) || node?.label || '', [lang]);
  const response = current ? (lang === 'tl' && current.responseTl) || current.response : greeting;

  const loadRoot = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/chatbot/menu', { params: { parent: 'null' } });
      setMenu(data.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && path.length === 0) loadRoot();
  }, [enabled, path.length, loadRoot]);

  const open = useCallback(async (node) => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/chatbot/node/${node._id}`);
      setCurrent(data.data);
      setMenu(data.data.children);
      return data.data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const select = async (node) => {
    await open(node);
    setPath((p) => [...p, node]);
  };

  const goBack = async () => {
    const next = path.slice(0, -1);
    setPath(next);
    if (next.length) await open(next[next.length - 1]);
    else setCurrent(null);
  };

  const reset = () => {
    setPath([]);
    setCurrent(null);
  };

  return { path, menu, response, label, isLoading, select, goBack, reset };
};

export default useChatbotTree;
