import { useEffect, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import api from '../../utils/api';
import EmptyState from '../../components/common/EmptyState';

const DEFAULT_FAQS = [
  { question: 'How do I request a barangay document?', answer: 'Log in to your resident account, go to Document Requests, choose the document type, and submit the required details. You will be notified once it is approved.' },
  { question: 'How long does document processing take?', answer: 'Most documents are processed within 1-2 business days depending on the type and completeness of requirements.' },
  { question: 'How do I report an incident?', answer: 'Go to Report Incident in your dashboard, pin the location on the map, select a category and severity, and submit with optional photos.' },
  { question: 'Is CiviCare free to use?', answer: 'Yes, registering and using CiviCare is completely free for all barangay residents.' },
];

const FAQItem = ({ item, isOpen, onClick }) => (
  <div className="card overflow-hidden">
    <button onClick={onClick} className="flex w-full items-center justify-between p-5 text-left font-semibold">
      {item.question}
      <FiChevronDown className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && <p className="px-5 pb-5 text-sm text-gray-500 dark:text-gray-400">{item.answer}</p>}
  </div>
);

const FAQ = () => {
  const [faqs, setFaqs] = useState(null);
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    api.get('/settings/faqs').then(({ data }) => setFaqs(data.data?.length ? data.data : DEFAULT_FAQS));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">FAQ</span>
        <h1 className="mt-4 text-4xl font-extrabold">Frequently Asked Questions</h1>
      </div>

      <div className="mt-12 space-y-3">
        {faqs === null && <EmptyState title="Loading..." />}
        {faqs?.map((item, i) => (
          <FAQItem key={item.question} item={item} isOpen={openIndex === i} onClick={() => setOpenIndex(openIndex === i ? -1 : i)} />
        ))}
      </div>
    </div>
  );
};

export default FAQ;
