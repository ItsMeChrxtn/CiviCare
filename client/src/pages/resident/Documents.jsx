import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { format, differenceInYears } from 'date-fns';
import toast from 'react-hot-toast';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import { SERVICE_DOCUMENTS, CIVIL_STATUS, documentLabel } from '../../utils/constants';

const fullAddress = (a) => [a?.street, a?.purok, a?.barangay && `Brgy. ${a.barangay}`, a?.city, a?.province].filter(Boolean).join(', ');

const Documents = () => {
  const { user } = useAuth();
  const { t } = usePreferences();
  const { rows, meta, params, setPage, isLoading, refetch } = usePaginatedFetch('/documents');
  const [selected, setSelected] = useState([]);
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

  const onSubmit = async ({ purpose, ...details }) => {
    if (!selected.length) return toast.error(t('service.chooseOne'));
    try {
      // One request per ticked document so each can be approved and tracked on its own.
      await Promise.all(selected.map((type) => api.post('/documents', { type, purpose, details })));
      toast.success(t('service.sent', { count: selected.length }), { duration: 6000 });
      setSelected([]);
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
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 lg:grid-cols-[15rem_1fr_17rem]">
        <fieldset className="h-fit rounded-xl bg-brand-green p-4 text-white shadow-card">
          <legend className="sr-only">{t('service.available')}</legend>
          <p className="mb-3 flex items-baseline gap-2 font-display font-bold">
            <span className="text-2xl">1</span> —{t('service.available')}—
          </p>
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
          <p className="mb-4 flex items-baseline gap-3 font-display font-bold">
            <span className="text-2xl">2</span>
            <span className="flex-1 text-center">{t('service.personal')}</span>
          </p>
          <div className="space-y-3">
            {field('firstName', 'service.firstName')}
            {field('middleName', 'service.middleName', { optional: true })}
            {field('lastName', 'service.lastName')}
            <div className="grid grid-cols-2 gap-3">
              {field('age', 'service.age', { type: 'number' })}
              {field('civilStatus', 'service.civilStatus', { select: true })}
            </div>
            {field('address', 'service.address')}
            {field('purpose', 'service.purpose')}
          </div>
          <div className="mt-5 flex justify-center gap-4">
            <button type="submit" disabled={isSubmitting} className="btn-primary min-w-[8rem]">
              {isSubmitting ? t('common.loading') : t('common.submit')}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelected([]);
                reset();
              }}
              className="btn-danger min-w-[8rem]"
            >
              {t('common.cancel')}
            </button>
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-xl bg-brand-green p-4 text-sm text-white shadow-card">
            <p className="font-display text-2xl font-bold">3</p>
            <p className="font-semibold">{t('service.step3')}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px]">
              <li>{t('service.ifYes')}</li>
              <li>{t('service.ifNo')}</li>
            </ul>
            <p className="mt-4 font-display text-2xl font-bold">4</p>
            <p className="font-semibold">{t('service.step4')}</p>
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
      </form>

      <section className="card p-5">
        <h2 className="mb-4 font-display text-lg font-bold">{t('service.myRequests')}</h2>
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          emptyMessage={t('service.noRequests')}
          columns={[
            {
              header: 'Request ID',
              accessor: (r) => (
                <Link to={`/resident/documents/${r._id}`} className="font-medium text-primary-700 hover:underline dark:text-primary-400">
                  {r.referenceCode}
                </Link>
              ),
            },
            { header: 'Document', accessor: (r) => documentLabel(r.type) },
            { header: t('service.purpose'), accessor: (r) => r.purpose },
            { header: 'Fee', accessor: (r) => (r.fee ? `₱${r.fee}` : 'Free') },
            { header: t('common.status'), accessor: (r) => <Badge status={r.status} /> },
            { header: t('common.date'), accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy') },
          ]}
          rows={rows}
        />
      </section>
    </div>
  );
};

export default Documents;
