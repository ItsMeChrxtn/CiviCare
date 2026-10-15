import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiHome, FiPhoneCall, FiMessageSquare } from 'react-icons/fi';
import api from '../../utils/api';
import useSetting from '../../hooks/useSetting';
import useChatbotTree from '../../hooks/useChatbotTree';
import { usePreferences } from '../../contexts/PreferencesContext';
import Modal from '../../components/common/Modal';
import HotlineIcon from '../../components/common/HotlineIcon';

const telHref = (n) => `tel:${String(n).replace(/[^\d+]/g, '')}`;

/** Menu-driven virtual assistant (docu Figure 7): quick actions plus a button-only FAQ decision tree. */
const Assistant = () => {
  const { t } = usePreferences();
  const navigate = useNavigate();
  const [general] = useSetting('general');
  const [hotlines, setHotlines] = useState([]);
  const [callOpen, setCallOpen] = useState(false);
  const { path, menu, response, label, isLoading, select, goBack, reset } = useChatbotTree({ greeting: '' });

  useEffect(() => {
    api.get('/hotlines').then(({ data }) => setHotlines(data.data)).catch(() => {});
  }, []);

  const staffLines = [
    ...((general?.phone || general?.contactPhone)
      ? [{ _id: 'hall', name: general.barangayName || 'Barangay Hall', number: general.phone || general.contactPhone, category: 'barangay' }]
      : []),
    ...hotlines.filter((h) => ['barangay', 'mdrrmo'].includes(h.category)),
  ];

  const actions = [
    { label: t('assistant.callStaff'), onClick: () => setCallOpen(true) },
    { label: t('assistant.reportIncident'), onClick: () => navigate('/resident/incidents') },
    { label: t('assistant.requestService'), onClick: () => navigate('/resident/documents') },
    { label: t('assistant.checklist'), onClick: () => navigate('/resident/emergency-hub#checklist') },
  ];

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card dark:bg-gray-900">
      <div className="rounded-b-3xl bg-brand-green px-6 py-6 text-center text-white">
        <p className="font-display text-4xl font-extrabold sm:text-5xl">{t('assistant.welcome')}</p>
        <p className="mt-1 font-display text-2xl font-bold sm:text-3xl">{t('assistant.help')}</p>
      </div>

      <div className="mx-auto max-w-md space-y-5 px-6 py-8">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="w-full rounded-lg bg-brand-green px-6 py-3.5 font-display text-lg font-bold text-white shadow transition hover:bg-brand-greenDark active:scale-[0.98]"
          >
            {a.label}
          </button>
        ))}
      </div>

      <section className="border-t border-gray-100 px-6 py-6 dark:border-gray-800" aria-live="polite">
        <div className="mx-auto max-w-2xl">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <FiMessageSquare className="text-primary-600" /> {t('assistant.faq')}
          </h2>
          <p className="text-sm text-gray-500">{t('assistant.faqHint')}</p>

          {path.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <button onClick={goBack} className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 font-semibold dark:border-gray-700">
                <FiArrowLeft /> {t('common.back')}
              </button>
              <button onClick={reset} className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 font-semibold dark:border-gray-700">
                <FiHome /> {t('assistant.mainMenu')}
              </button>
              <span className="text-gray-400">{path.map(label).join(' › ')}</span>
            </div>
          )}

          {response && <div className="mt-4 whitespace-pre-line rounded-2xl rounded-tl-sm bg-primary-50 p-4 text-sm leading-relaxed text-gray-800 dark:bg-primary-500/10 dark:text-gray-100">{response}</div>}

          <div className="mt-4 flex flex-wrap gap-2">
            {isLoading ? (
              <p className="text-sm text-gray-400">{t('common.loading')}</p>
            ) : menu.length ? (
              menu.map((node) => (
                <button
                  key={node._id}
                  onClick={() => select(node)}
                  className="rounded-full border-2 border-primary-600 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-600 hover:text-white dark:text-primary-300"
                >
                  {label(node)}
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-400">{t('assistant.noMore')}</p>
            )}
          </div>
        </div>
      </section>

      <Modal isOpen={callOpen} onClose={() => setCallOpen(false)} title={t('assistant.callTitle')} size="sm">
        <p className="mb-3 text-sm text-gray-500">{t('assistant.callBody', { hours: general?.officeHours || '' })}</p>
        <div className="space-y-2">
          {staffLines.map((h) => (
            <a key={h._id} href={telHref(h.number)} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition hover:bg-primary-50 dark:border-gray-800 dark:hover:bg-primary-500/10">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white">
                <HotlineIcon category={h.category} className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">{h.name}</span>
                <span className="block text-sm text-primary-700 dark:text-primary-400">{h.number}</span>
              </span>
              <FiPhoneCall className="text-primary-600" />
            </a>
          ))}
          <a href="tel:911" className="flex items-center gap-3 rounded-xl bg-red-600 p-3 text-white">
            <FiPhoneCall /> <span className="font-semibold">{t('assistant.national911')}</span>
          </a>
        </div>
      </Modal>
    </div>
  );
};

export default Assistant;
