import { useEffect, useState } from 'react';
import { FiChevronDown, FiHelpCircle } from 'react-icons/fi';
import api from '../../utils/api';
import EmptyState from '../common/EmptyState';
import { Skeleton } from '../common/Skeleton';
import { usePreferences } from '../../contexts/PreferencesContext';

/** One question; follow-up questions (from the FAQ Manager) render nested inside its answer. */
const FAQItem = ({ item, depth = 0 }) => {
  const { lang } = usePreferences();
  const [open, setOpen] = useState(false);
  const question = (lang === 'tl' && item.questionTl) || item.question;
  const answer = (lang === 'tl' && item.answerTl) || item.answer;
  return (
    <div className={depth === 0 ? 'card overflow-hidden' : 'border-t border-gray-100 dark:border-gray-800'}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-4 text-left font-semibold ${depth === 0 ? 'p-5' : 'px-5 py-3 text-sm'}`}
      >
        {question}
        <FiChevronDown className={`h-5 w-5 shrink-0 text-primary-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="animate-fadeIn">
          <p className="whitespace-pre-line px-5 pb-4 text-sm text-gray-600 dark:text-gray-300">{answer}</p>
          {item.children?.length > 0 && (
            <div className="mx-5 mb-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              {item.children.map((c) => (
                <FAQItem key={c._id} item={c} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** FAQ accordion fed by the FAQ Manager. Panel revision: FAQs appear only on the landing page. */
const FAQList = () => {
  const [faqs, setFaqs] = useState(null);

  useEffect(() => {
    api
      .get('/chatbot/faq')
      .then(({ data }) => setFaqs(data.data))
      .catch(() => setFaqs([]));
  }, []);

  return (
    <div className="space-y-3">
      {faqs === null &&
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5">
            <Skeleton className="h-5 w-2/3" />
          </div>
        ))}
      {faqs?.length === 0 && <EmptyState icon={FiHelpCircle} title="No FAQs yet" message="Check back later for answers to common questions." />}
      {faqs?.map((item) => (
        <FAQItem key={item._id} item={item} />
      ))}
    </div>
  );
};

export default FAQList;
