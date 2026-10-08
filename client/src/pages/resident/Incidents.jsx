import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiLifeBuoy, FiChevronDown, FiCamera, FiMapPin } from 'react-icons/fi';
import { MdLocalFireDepartment } from 'react-icons/md';
import { FaCarCrash } from 'react-icons/fa';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import useSetting from '../../hooks/useSetting';
import useSocketEvent from '../../hooks/useSocketEvent';
import api from '../../utils/api';
import { usePreferences } from '../../contexts/PreferencesContext';
import LocationPicker from '../../components/map/LocationPicker';
import TicketTracker from '../../components/incidents/TicketTracker';
import Pagination from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';
import { PRIORITY_OPTIONS, categoryLabel } from '../../utils/constants';

// The four quick buttons on the report screen; "Others" opens the remaining categories.
const QUICK = [
  { value: 'fire', icon: MdLocalFireDepartment, color: 'text-red-500' },
  { value: 'electrical', icon: FiAlertTriangle, color: 'text-yellow-400' },
  { value: 'road_accident', icon: FaCarCrash, color: 'text-white' },
  { value: 'rescue', icon: FiLifeBuoy, color: 'text-white' },
];
const OTHERS = ['flood', 'medical', 'crime', 'dispute', 'other'];

const Incidents = () => {
  const { t } = usePreferences();
  const [general] = useSetting('general');
  const { rows, meta, params, setPage, isLoading, refetch } = usePaginatedFetch('/incidents', { limit: 5 });
  const [location, setLocation] = useState(null);
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('low');
  const [showOthers, setShowOthers] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [details, setDetails] = useState({ description: '', address: '' });
  const [image, setImage] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Status changes made by officials appear here without a refresh.
  useSocketEvent('notification:new', (n) => n?.type === 'incident' && refetch());

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error(t('incident.geoFail'));
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        toast.error(t('incident.geoFail'));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const submit = async () => {
    if (!category) return toast.error(t('incident.needType'));
    if (!location) return toast.error(t('incident.needPin'));
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('category', category);
      form.append('severity', severity);
      form.append('lat', location[0]);
      form.append('lng', location[1]);
      if (details.description) form.append('description', details.description);
      if (details.address) form.append('address', details.address);
      if (image) form.append('images', image);

      const { data } = await api.post('/incidents', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(t('incident.sent', { code: data.data.referenceCode }), { duration: 6000 });
      setCategory('');
      setSeverity('low');
      setLocation(null);
      setDetails({ description: '', address: '' });
      setImage(null);
      setShowDetails(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Failed to report incident');
    } finally {
      setSubmitting(false);
    }
  };

  const tile = (active) =>
    `flex flex-col items-center justify-center gap-1 rounded-xl p-3 text-center text-xs font-bold text-white shadow transition ${
      active ? 'bg-primary-900 ring-4 ring-amber-300' : 'bg-primary-700 hover:bg-primary-800'
    }`;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-3 shadow-card dark:bg-gray-900 sm:p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_15rem]">
          <div className="overflow-hidden rounded-xl border-4 border-primary-700">
            <LocationPicker value={location} onChange={setLocation} center={general?.mapCenter} height="22rem" />
            <p className="flex items-center gap-1.5 bg-primary-700 px-3 py-1.5 text-xs text-white">
              <FiMapPin />
              {location ? `${t('incident.pinned')}: ${location[0].toFixed(5)}, ${location[1].toFixed(5)}` : t('incident.pinHint')}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{t('incident.type')}</p>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t('incident.type')}>
              {QUICK.map(({ value, icon: Icon, color }) => (
                <button key={value} type="button" role="radio" aria-checked={category === value} onClick={() => setCategory(value)} className={tile(category === value)}>
                  <Icon className={`h-10 w-10 ${color}`} />
                  {t(`cat.${value}`)}
                </button>
              ))}
            </div>
            <div className="relative mt-3">
              <button
                type="button"
                onClick={() => setShowOthers((v) => !v)}
                aria-expanded={showOthers}
                className={`${tile(OTHERS.includes(category))} w-full`}
              >
                <span className="text-lg tracking-[0.3em]" aria-hidden="true">
                  ○○○○
                </span>
                {OTHERS.includes(category) ? t(`cat.${category}`) : t('cat.other')}
              </button>
              {showOthers && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {OTHERS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setCategory(c);
                        setShowOthers(false);
                      }}
                      className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                        category === c ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {t(`cat.${c}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-bold text-white shadow transition hover:bg-black disabled:opacity-60"
          >
            {locating ? t('incident.locating') : t('incident.useLocation')}
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-lg bg-red-600 px-10 py-4 font-display text-2xl font-extrabold tracking-wide text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? t('common.loading') : t('incident.reportNow')}
          </button>

          <fieldset className="rounded-xl bg-primary-900 px-5 py-3 text-white">
            <legend className="sr-only">{t('incident.priority')}</legend>
            <p className="mb-1 text-center font-display font-bold">{t('incident.priority')}</p>
            {PRIORITY_OPTIONS.map((p) => (
              <label key={p.value} className="flex cursor-pointer items-center gap-3 py-0.5">
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  checked={severity === p.value}
                  onChange={() => setSeverity(p.value)}
                  className="h-5 w-5 accent-white"
                />
                <span className={`font-display text-lg font-extrabold ${p.color}`}>{t(p.labelKey)}</span>
              </label>
            ))}
          </fieldset>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          aria-expanded={showDetails}
          className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary-700 dark:text-primary-400"
        >
          <FiChevronDown className={`transition ${showDetails ? 'rotate-180' : ''}`} /> {t('incident.details')}
        </button>
        {showDetails && (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <textarea
              rows={3}
              placeholder={t('incident.detailsPh')}
              value={details.description}
              onChange={(e) => setDetails((d) => ({ ...d, description: e.target.value }))}
              className="input-field md:row-span-2"
              aria-label={t('incident.details')}
            />
            <input
              placeholder={t('incident.address')}
              value={details.address}
              onChange={(e) => setDetails((d) => ({ ...d, address: e.target.value }))}
              className="input-field"
              aria-label={t('incident.address')}
            />
            <label className="input-field flex cursor-pointer items-center gap-2 text-gray-500">
              <FiCamera /> {image ? image.name : t('incident.photo')}
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setImage(e.target.files[0] || null)} />
            </label>
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-display text-lg font-bold">{t('incident.myReports')}</h2>
        {isLoading ? (
          <TableSkeleton cols={3} />
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">{t('incident.noReports')}</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((r) => (
              <li key={r._id}>
                <Link to={`/resident/incidents/${r._id}`} className="grid grid-cols-1 items-center gap-3 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 md:grid-cols-[1fr_18rem]">
                  <div>
                    <p className="font-mono text-xs text-gray-400">{r.referenceCode}</p>
                    <p className="font-semibold">{categoryLabel(r.category)}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(r.createdAt), 'MMM d, yyyy h:mm a')} · {t('incident.priority')}: {t(`status.${r.severity}`)}
                    </p>
                  </div>
                  <TicketTracker status={r.status} compact />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={meta.page || params.page} totalPages={meta.totalPages} onPageChange={setPage} />
      </section>
    </div>
  );
};

export default Incidents;
