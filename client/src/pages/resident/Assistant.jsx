import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPhoneCall } from 'react-icons/fi';
import api from '../../utils/api';
import useSetting from '../../hooks/useSetting';
import { usePreferences } from '../../contexts/PreferencesContext';
import Modal from '../../components/common/Modal';
import HotlineIcon from '../../components/common/HotlineIcon';

const telHref = (n) => `tel:${String(n).replace(/[^\d+]/g, '')}`;

/** Menu-driven virtual assistant (docu Figure 7): quick actions. FAQs are on the landing page only (panel revision). */
const Assistant = () => {
  const { t } = usePreferences();
  const navigate = useNavigate();
  const [general] = useSetting('general');
  const [hotlines, setHotlines] = useState([]);
  const [callOpen, setCallOpen] = useState(false);

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
