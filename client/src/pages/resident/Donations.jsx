import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiCheck, FiCheckCircle, FiGift, FiHeart, FiShield, FiXCircle } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import useSetting from '../../hooks/useSetting';
import api from '../../utils/api';
import { usePreferences } from '../../contexts/PreferencesContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import DonationForm from '../../components/donation/DonationForm';
import { DONATION_STATUS } from '../../utils/constants';

const GUIDELINES = ['donation.guide1', 'donation.guide2', 'donation.guide3'];

const DriveCard = ({ drive, t }) => {
  const goal = Number(drive.goalTarget) || 0;
  const collected = Number(drive.collected) || 0;
  const percent = goal > 0 ? Math.min(100, Math.round((collected / goal) * 100)) : 0;

  return (
    <section className="card p-4">
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
          <FiGift className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-sm font-bold">{t('donation.currentDrive')}</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{drive.subtitle}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-600 dark:text-gray-300">{drive.description}</p>
      {goal > 0 && (
        <>
          <dl className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500 dark:text-gray-400">{t('donation.goalTarget')}</dt>
              <dd className="text-right font-semibold">
                {goal} {drive.unit}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500 dark:text-gray-400">{t('donation.collected')}</dt>
              <dd className="text-right font-semibold text-primary-700 dark:text-primary-300">
                {collected} {drive.unit} ({percent}%)
              </dd>
            </div>
          </dl>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={t('donation.collected')}>
            <div className="h-full rounded-full bg-primary-600" style={{ width: `${percent}%` }} />
          </div>
        </>
      )}
    </section>
  );
};

const Donations = () => {
  const { t } = usePreferences();
  const { rows, meta, params, setPage, isLoading, refetch } = usePaginatedFetch('/donations', { sort: '-createdAt' });
  const [drive] = useSetting('donationDrive');
  // Panel revision: residents can cancel a pledge until the barangay has received it.
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);

  const details = (r) => (r.type === 'cash' ? `₱${Number(r.amount || 0).toLocaleString()}` : r.quantity || '—');
  const handover = (r) =>
    r.deliveryMethod ? `${t(`donation.handover.${r.deliveryMethod}`)}${r.targetDate ? ` · ${format(new Date(r.targetDate), 'MMM d, yyyy')}` : ''}` : '—';

  const cancelPledge = async () => {
    setBusy(true);
    try {
      await api.patch(`/donations/${cancelling._id}/cancel`);
      toast.success(t('donation.cancelled'));
      setCancelling(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || t('donation.cancelFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title flex items-center gap-2">
            <FiHeart className="shrink-0 text-primary-600" /> {t('donation.portalTitle')}
          </h1>
          <p className="page-subtitle">{t('donation.portalSub')}</p>
        </div>
        {drive?.active && (
          <span className="badge border border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300">
            <FiCheckCircle className="shrink-0" /> {t('donation.driveActive', { name: drive.name })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <DonationForm onSuccess={refetch} />

        <aside className="space-y-4 xl:sticky xl:top-20">
          {drive?.active && <DriveCard drive={drive} t={t} />}
          <section className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
              <FiShield className="text-primary-600" /> {t('donation.guidelines')}
            </h2>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
              {GUIDELINES.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <FiCheck className="mt-0.5 shrink-0 text-primary-600" /> {t(key)}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="card animate-fadeIn mt-6 p-5">
        <h2 className="mb-4 font-display text-lg font-bold">{t('donation.myPledges')}</h2>
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          emptyMessage={t('donation.none')}
          columns={[
            { header: t('donation.reference'), accessor: (r) => r.referenceCode },
            { header: t('donation.category'), accessor: (r) => t(`donation.type.${r.type}`) },
            { header: t('donation.quantity'), accessor: details },
            { header: t('donation.handoverCol'), accessor: handover },
            { header: t('common.status'), accessor: (r) => <Badge status={r.status} /> },
            { header: t('common.date'), accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy') },
            {
              header: t('common.actions'),
              accessor: (r) =>
                r.status === DONATION_STATUS.PLEDGED ? (
                  <button
                    onClick={() => setCancelling(r)}
                    className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                  >
                    <FiXCircle /> {t('donation.cancel')}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                ),
            },
          ]}
          rows={rows}
        />
      </section>

      <ConfirmDialog
        isOpen={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={cancelPledge}
        loading={busy}
        title={t('donation.cancel')}
        message={t('donation.cancelConfirm', { code: cancelling?.referenceCode })}
        confirmLabel={t('donation.cancel')}
        danger
      />
    </div>
  );
};

export default Donations;
