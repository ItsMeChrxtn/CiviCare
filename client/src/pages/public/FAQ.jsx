import { useEffect, useState } from 'react';
import { FiChevronDown, FiHelpCircle } from 'react-icons/fi';
import api from '../../utils/api';
import EmptyState from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';

const DEFAULT_FAQS = [
  { question: 'How do I request a barangay document?', answer: 'Log in to your resident account, go to Document Requests, choose the document type, and submit the required details. You will be notified once it is approved.' },
  { question: 'How long does document processing take?', answer: 'Most documents are processed within 1-2 business days depending on the type and completeness of requirements.' },
  { question: 'How do I report an incident?', answer: 'Go to Report Incident in your dashboard, pin the location on the map, select a category and severity, and submit with optional photos.' },
  { question: 'Is CiviCare free to use?', answer: 'Yes, registering and using CiviCare is completely free for all barangay residents.' },
];

const FAQItem = ({ item, isOpen, onClick }) => (
  <div className="card card-hover overflow-hidden">
    <button onClick={onClick} className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold">
      {item.question}
      <FiChevronDown className={`h-5 w-5 shrink-0 text-primary-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && <p className="animate-fadeIn px-5 pb-5 text-sm text-gray-500 dark:text-gray-400">{item.answer}</p>}
  </div>
);

const FAQ = () => {
  const [faqs, setFaqs] = useState(null);
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    api.get('/settings/faqs').then(({ data }) => setFaqs(data.data?.length ? data.data : DEFAULT_FAQS));
  }, []);

  return (
    <div className="mx-auto max-w-3xl animate-fadeIn px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="section-eyebrow">
          <FiHelpCircle /> FAQ
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight">Frequently Asked Questions</h1>
      </div>

      <div className="mt-12 space-y-3">
        {faqs === null &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5">
              <Skeleton className="h-5 w-2/3" />
            </div>
          ))}
        {faqs?.length === 0 && <EmptyState icon={FiHelpCircle} title="No FAQs yet" message="Check back later for answers to common questions." />}
        {faqs?.map((item, i) => (
          <FAQItem key={item.question} item={item} isOpen={openIndex === i} onClick={() => setOpenIndex(openIndex === i ? -1 : i)} />
        ))}
      </div>
    </div>
  );
};

export default FAQ;
