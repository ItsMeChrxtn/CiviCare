import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { format, differenceInYears } from 'date-fns';
import toast from 'react-hot-toast';
import { BsQrCode } from 'react-icons/bs';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import { FiSearch, FiUpload, FiX } from 'react-icons/fi';
import { SERVICE_DOCUMENTS, CIVIL_STATUS, DOCUMENT_STATUS, documentLabel } from '../../utils/constants';

const MAX_ID_SIZE = 5 * 1024 * 1024; // matches the server's upload limit

const fullAddress = (a) => [a?.street, a?.purok, a?.barangay && `Brgy. ${a.barangay}`, a?.city, a?.province].filter(Boolean).join(', ');

const Documents = () => {
  const { user } = useAuth();
  const { t } = usePreferences();
  const { rows, meta, params, setPage, updateFilters, isLoading, refetch } = usePaginatedFetch('/documents');
  const [selected, setSelected] = useState([]);
  const [validId, setValidId] = useState(null);
  // Panel revision: the next steps and reminders only appear once the personal details are submitted.
  const [submitted, setSubmitted] = useState(false);
  const validIdPreview = useMemo(() => (validId ? URL.createObjectURL(validId) : ''), [validId]);
  useEffect(() => () => validIdPreview && URL.revokeObjectURL(validIdPreview), [validIdPreview]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      middleName: user?.middleName || '',
      lastName: user?.lastName || '',
      age: user?.birthdate ? differenceInYears(new Date(), new Date(user.birthdate)) : '',
      civilStatus: user?.civilStatus || '',
      address: fullAddress(user?.address),
      purpose: '',
    },
  });

  const toggle = (value) => setSelected((s) => (s.includes(value) ? s.filter((v) => v !== value) : [...s, value]));

  const pickValidId = (file) => {
    if (file && file.size > MAX_ID_SIZE) {
      toast.error(t('service.validIdTooBig'));
      return;
    }
    setValidId(file || null);
  };

  const onSubmit = async ({ purpose, ...details }) => {
    if (!selected.length) return toast.error(t('service.chooseOne'));
    if (!validId) return toast.error(t('service.validIdMissing'));
    try {
      // One request per ticked document so each can be approved and tracked on its own.
      await Promise.all(
        selected.map((type) => {
          const form = new FormData();
          form.append('type', type);
          form.append('purpose', purpose);
          form.append('details', JSON.stringify(details));
          form.append('validId', validId);
          return api.post('/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        })
      );
      toast.success(t('service.sent', { count: selected.length }), { duration: 6000 });
      setSelected([]);
      setValidId(null);
      setSubmitted(true);
      reset({ ...details, purpose: '' });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    }
  };

  const field = (name, labelKey, opts = {}) => (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {t(labelKey)} <span className="text-red-500">*</span>
      </label>
      {opts.select ? (
        <select id={name} {...register(name, { required: true })} className="input-field capitalize">
          <option value="">{t('service.enter', { field: t(labelKey) })}</option>
          {CIVIL_STATUS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          type={opts.type || 'text'}
          min={opts.type === 'number' ? 1 : undefined}
          max={opts.type === 'number' ? 120 : undefined}
          placeholder={t('service.enter', { field: t(labelKey) })}
          {...register(name, { required: !opts.optional })}
          className="input-field"
        />
      )}
      {errors[name] && <p className="mt-1 text-xs text-red-500">{t('common.required')}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`grid grid-cols-1 gap-4 md:grid-cols-[13rem_1fr] ${submitted ? 'lg:grid-cols-[15rem_1fr_17rem]' : 'lg:grid-cols-[15rem_1fr]'}`}
      >
        <fieldset className="h-fit rounded-xl bg-brand-green p-4 text-white shadow-card">
          <legend className="sr-only">{t('service.available')}</legend>
          <p className="mb-3 font-display font-bold">{t('service.available')}</p>
          <div className="space-y-3">
            {SERVICE_DOCUMENTS.map((d) => (
              <label key={d.value} className="flex cursor-pointer items-start gap-3 text-sm font-semibold">
                <input type="checkbox" checked={selected.includes(d.value)} onChange={() => toggle(d.value)} className="mt-0.5 h-4 w-4 shrink-0 accent-white" />
                {d.label}
              </label>
            ))}
          </div>
        </fieldset>

        <section className="rounded-xl bg-white p-5 shadow-card dark:bg-gray-900">
          <p className="mb-4 text-center font-display font-bold">{t('service.personal')}</p>
          <div className="space-y-3">
            {field('firstName', 'service.firstName')}
            {field('middleName', 'service.middleName', { optional: true })}
            {field('lastName', 'service.lastName')}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {field('age', 'service.age', { type: 'number' })}
              {field('civilStatus', 'service.civilStatus', { select: true })}
            </div>
            {field('address', 'service.address')}
            {field('purpose', 'service.purpose')}
            <div>
              <p className="mb-1 block text-sm font-medium">
                {t('service.validId')} <span className="text-red-500">*</span>
              </p>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t('service.validIdHint')}</p>
              {validId ? (
                <div className="relative w-fit">
                  <img src={validIdPreview} alt={t('service.validId')} className="max-h-48 rounded-lg border border-gray-200 object-contain dark:border-gray-700" />
                  <button
                    type="button"
                    onClick={() => setValidId(null)}
                    className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white shadow"
                    aria-label={t('service.validIdRemove')}
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="input-field flex cursor-pointer items-center gap-2 text-gray-500">
                  <FiUpload className="shrink-0" /> <span className="truncate">{t('service.validIdPick')}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      pickValidId(e.target.files[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          <div className="mt-5 flex justify-center gap-4">
            <button type="submit" disabled={isSubmitting} className="btn-primary min-w-[8rem]">
              {isSubmitting ? t('common.loading') : t('common.submit')}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelected([]);
                setValidId(null);
                reset();
              }}
              className="btn-danger min-w-[8rem]"
            >
              {t('common.cancel')}
            </button>
          </div>
        </section>

        {submitted && (
          <aside className="animate-slideUp space-y-3 md:col-span-2 lg:col-span-1">
            <div className="rounded-xl bg-brand-green p-4 text-sm text-white shadow-card">
              <p className="mb-2 font-display text-base font-bold">{t('service.nextSteps')}</p>
              <p className="font-semibold">{t('service.step3')}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px]">
                <li>{t('service.ifYes')}</li>
                <li>{t('service.ifNo')}</li>
              </ul>
              <p className="mt-4 font-semibold">{t('service.step4')}</p>
            </div>
            <div className="text-center text-[13px] text-primary-800 dark:text-primary-300">
              <p className="font-bold">{t('service.reminders')}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-left">
                <li>{t('service.rem1')}</li>
                <li>{t('service.rem2')}</li>
              </ul>
              <p className="mt-3 font-semibold">{t('service.thanks')}</p>
            </div>
          </aside>
        )}
      </form>

      <section className="card p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="font-display text-lg font-bold">{t('service.myRequests')}</h2>
          {/* Panel revision: filters so residents can track their requests. */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-56">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder={t('service.searchPh')}
                onChange={(e) => updateFilters({ search: e.target.value || undefined })}
                className="input-field !py-2 pl-9"
                aria-label={t('service.searchPh')}
              />
            </div>
            <select onChange={(e) => updateFilters({ type: e.target.value || undefined })} className="input-field !py-2 sm:w-52" aria-label={t('doc.document')}>
              <option value="">{t('service.allDocuments')}</option>
              {SERVICE_DOCUMENTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <select onChange={(e) => updateFilters({ status: e.target.value || undefined })} className="input-field !py-2 sm:w-44" aria-label={t('common.status')}>
              <option value="">{t('service.allStatuses')}</option>
              {Object.values(DOCUMENT_STATUS).map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          emptyMessage={t('service.noRequests')}
          columns={[
            {
              header: t('doc.requestId'),
              accessor: (r) => (
                <Link to={`/resident/documents/${r._id}`} className="font-medium text-primary-700 hover:underline dark:text-primary-400">
                  {r.referenceCode}
                </Link>
              ),
            },
            { header: t('doc.document'), accessor: (r) => documentLabel(r.type) },
            { header: t('service.purpose'), accessor: (r) => r.purpose },
            { header: t('common.status'), accessor: (r) => <Badge status={r.status} /> },
            {
              header: t('doc.qrCode'),
              accessor: (r) =>
                ['ready_for_pickup', 'claimed'].includes(r.status) ? (
                  <Link to={`/resident/documents/${r._id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline dark:text-primary-400">
                    <BsQrCode /> {t('doc.viewQr')}
                  </Link>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                ),
            },
            { header: t('common.date'), accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy') },
          ]}
          rows={rows}
        />
      </section>
    </div>
  );
};

export default Documents;
