import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiLifeBuoy, FiChevronDown, FiCamera, FiMapPin, FiMoreHorizontal, FiX } from 'react-icons/fi';
import { MdLocalFireDepartment, MdMyLocation } from 'react-icons/md';
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
import Modal from '../../components/common/Modal';
import { PRIORITY_OPTIONS, categoryLabel, isInsideMagdiwang } from '../../utils/constants';

// The four quick buttons on the report screen; "Others" opens the remaining categories.
// Panel revision: small, white-only icons.
const QUICK = [
  { value: 'fire', icon: MdLocalFireDepartment },
  { value: 'electrical', icon: FiAlertTriangle },
  { value: 'road_accident', icon: FaCarCrash },
  { value: 'rescue', icon: FiLifeBuoy },
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
  const [details, setDetails] = useState({ description: '', address: '' });
  const [image, setImage] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const imagePreview = useMemo(() => (image ? URL.createObjectURL(image) : ''), [image]);
  useEffect(() => () => imagePreview && URL.revokeObjectURL(imagePreview), [imagePreview]);

  // Status changes made by officials appear here without a refresh.
  useSocketEvent('notification:new', (n) => n?.type === 'incident' && refetch());

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error(t('incident.geoFail'));
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = [pos.coords.latitude, pos.coords.longitude];
        if (isInsideMagdiwang(point)) setLocation(point);
        else toast.error(t('incident.outside'));
        setLocating(false);
      },
      () => {
        toast.error(t('incident.geoFail'));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const pickImage = (file) => {
    if (file && !file.type.startsWith('image/')) return toast.error(t('incident.photoOnly'));
    setImage(file || null);
  };

  // Panel revision: required fields are checked first, then a confirmation pop-up before sending.
  const askConfirm = () => {
    if (!category) return toast.error(t('incident.needType'));
    if (!location) return toast.error(t('incident.needPin'));
    if (details.description.trim().length < 10) return toast.error(t('incident.needDesc'));
    if (!image) return toast.error(t('incident.needPhoto'));
    setConfirming(true);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('category', category);
      form.append('severity', severity);
      form.append('lat', location[0]);
      form.append('lng', location[1]);
      form.append('description', details.description.trim());
      if (details.address) form.append('address', details.address);
      form.append('images', image);

      const { data } = await api.post('/incidents', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(t('incident.sent', { code: data.data.referenceCode }), { duration: 6000 });
      setCategory('');
      setSeverity('low');
      setLocation(null);
      setDetails({ description: '', address: '' });
      setImage(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || t('incident.failed'), { duration: 6000 });
    } finally {
      setSubmitting(false);
      setConfirming(false);
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
          <div className="overflow-hidden rounded-xl border-4 border-primary-700 lg:col-start-1 lg:row-start-1">
            <div className="flex justify-end bg-primary-700 px-2 pb-1">
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-white transition hover:bg-white/15 disabled:opacity-60"
              >
                <MdMyLocation className="h-4 w-4" /> {locating ? t('incident.locating') : t('incident.useLocation')}
              </button>
            </div>
            {/* Panel revision: Report Now is attached to the map's bottom-right corner (above the attribution) */}
            <div className="relative">
              <LocationPicker
                value={location}
                onChange={setLocation}
                onOutside={() => toast.error(t('incident.outside'))}
                center={general?.mapCenter}
                height="22rem"
              />
              <button
                type="button"
                onClick={askConfirm}
                disabled={submitting}
                className="absolute bottom-7 right-3 z-[1000] rounded-lg bg-red-600 px-5 py-2 font-display text-base font-extrabold tracking-wide text-white shadow-lg transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-60 sm:px-7 sm:py-2.5 sm:text-lg"
              >
                {submitting ? t('common.loading') : t('incident.reportNow')}
              </button>
            </div>
            <p className="flex items-center gap-1.5 bg-primary-700 px-3 py-1.5 text-xs text-white">
              <FiMapPin />
              {location ? `${t('incident.pinned')}: ${location[0].toFixed(5)}, ${location[1].toFixed(5)}` : t('incident.pinHint')}
            </p>
          </div>

          <div className="lg:col-start-2 lg:row-start-1">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{t('incident.type')}</p>
            {/* Panel revision: small icons, with a short description of what belongs in each category */}
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('incident.type')}>
              {QUICK.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={category === value}
                  onClick={() => setCategory(value)}
                  title={t(`catDesc.${value}`)}
                  className={tile(category === value)}
                >
                  <span className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-white" aria-hidden="true" />
                    {t(`cat.${value}`)}
                  </span>
                  <span className="text-[10px] font-normal leading-tight text-white/80">{t(`catDesc.${value}`)}</span>
                </button>
              ))}
            </div>
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => setShowOthers((v) => !v)}
                aria-expanded={showOthers}
                className={`${tile(OTHERS.includes(category))} w-full`}
              >
                <span className="flex items-center gap-1.5">
                  <FiMoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  {OTHERS.includes(category) ? t(`cat.${category}`) : t('cat.other')}
                  <FiChevronDown className={`h-3.5 w-3.5 transition ${showOthers ? 'rotate-180' : ''}`} aria-hidden="true" />
                </span>
                <span className="text-[10px] font-normal leading-tight text-white/80">{t('catDesc.others')}</span>
              </button>
              {showOthers && (
                <ul className="mt-2 space-y-1.5">
                  {OTHERS.map((c) => (
                    <li key={c}>
                      <button
                        type="button"
                        onClick={() => {
                          setCategory(c);
                          setShowOthers(false);
                        }}
                        className={`w-full rounded-lg border px-3 py-2 text-left ${
                          category === c ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="block text-xs font-bold">{t(`cat.${c}`)}</span>
                        <span className="block text-[11px] text-gray-500 dark:text-gray-400">{t(`catDesc.${c}`)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <fieldset className="mt-4 rounded-xl bg-primary-900 px-5 py-3 text-white">
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
        </div>

        {/* Panel revision: description and photo are required */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:row-span-2">
            <label htmlFor="incident-description" className="mb-1 block text-sm font-semibold">
              {t('incident.details')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="incident-description"
              rows={4}
              maxLength={2000}
              placeholder={t('incident.detailsPh')}
              value={details.description}
              onChange={(e) => setDetails((d) => ({ ...d, description: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="incident-address" className="mb-1 block text-sm font-semibold">
              {t('incident.address')}
            </label>
            <input
              id="incident-address"
              value={details.address}
              onChange={(e) => setDetails((d) => ({ ...d, address: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <p className="mb-1 block text-sm font-semibold">
              {t('incident.photo')} <span className="text-red-500">*</span>
            </p>
            {image ? (
              <div className="relative w-fit">
                <img src={imagePreview} alt={t('incident.photo')} className="max-h-32 rounded-lg border border-gray-200 object-contain dark:border-gray-700" />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white shadow"
                  aria-label={t('service.validIdRemove')}
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="input-field flex cursor-pointer items-center gap-2 text-gray-500">
                <FiCamera className="shrink-0" /> {t('incident.photoPick')}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => {
                    pickImage(e.target.files[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </section>

      <Modal isOpen={confirming} onClose={() => !submitting && setConfirming(false)} title={t('incident.confirmTitle')} size="sm">
        <dl className="space-y-2 text-sm">
          {[
            [t('incident.type'), category && t(`cat.${category}`)],
            [t('incident.priority'), t(PRIORITY_OPTIONS.find((p) => p.value === severity)?.labelKey || 'priority.low')],
            [t('incident.pinned'), location && `${location[0].toFixed(5)}, ${location[1].toFixed(5)}`],
            [t('incident.details'), details.description],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-gray-400">{k}</dt>
              <dd className="whitespace-pre-line font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">{t('incident.confirmBody')}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => setConfirming(false)} disabled={submitting} className="btn-secondary">
            {t('common.cancel')}
          </button>
          <button type="button" onClick={submit} disabled={submitting} className="btn-danger">
            {submitting ? t('common.loading') : t('incident.confirmYes')}
          </button>
        </div>
      </Modal>

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
