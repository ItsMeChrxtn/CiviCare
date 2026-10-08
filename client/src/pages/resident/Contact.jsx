import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiClock, FiMessageSquare } from 'react-icons/fi';
import useSetting from '../../hooks/useSetting';
import { usePreferences } from '../../contexts/PreferencesContext';

const Item = ({ icon: Icon, iconClass, label, children }) => (
  <div>
    <p className="flex items-center gap-2 font-display text-xl font-bold">
      <Icon className={`h-6 w-6 ${iconClass}`} /> {label}
    </p>
    <div className="mt-1 pl-8 text-lg text-gray-800 dark:text-gray-200">{children}</div>
  </div>
);

/** Contact Us (docu Figure 14): barangay hall details from Admin > System Settings. */
const Contact = () => {
  const { t } = usePreferences();
  const [general] = useSetting('general');
  const phone = general?.phone || general?.contactPhone;
  const email = general?.email || general?.contactEmail;

  return (
    <div className="max-w-2xl">
      <p className="mb-3 text-gray-700 dark:text-gray-300">{t('contact.intro')}</p>
      <section className="rounded-xl bg-white p-6 shadow-card dark:bg-gray-900">
        <h2 className="mb-5 text-center font-display text-2xl font-bold text-primary-900 dark:text-primary-200">{t('contact.info')}</h2>
        <div className="space-y-6">
          <Item icon={FiMapPin} iconClass="text-red-600" label={t('contact.hall')}>
            {general?.address || '—'}
          </Item>
          <Item icon={FiPhone} iconClass="text-red-600" label={t('contact.phone')}>
            {phone ? (
              <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="hover:underline">
                {phone}
              </a>
            ) : (
              '—'
            )}
          </Item>
          <Item icon={FiMail} iconClass="text-gray-600" label={t('contact.email')}>
            {email ? (
              <a href={`mailto:${email}`} className="break-all hover:underline">
                {email}
              </a>
            ) : (
              '—'
            )}
          </Item>
          <Item icon={FiClock} iconClass="text-gray-600" label={t('contact.hours')}>
            {general?.officeHours || '—'}
          </Item>
        </div>
        <Link to="/resident/feedback" className="btn-primary mt-8 w-full">
          <FiMessageSquare /> {t('contact.sendFeedback')}
        </Link>
      </section>
    </div>
  );
};

export default Contact;
