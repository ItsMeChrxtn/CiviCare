import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiPlus, FiXCircle } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import api from '../../utils/api';
import { usePreferences } from '../../contexts/PreferencesContext';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import DonationForm from '../../components/donation/DonationForm';
import { DONATION_STATUS } from '../../utils/constants';

const Donations = () => {
  const { t } = usePreferences();
  const { rows, meta, params, setPage, isLoading, refetch } = usePaginatedFetch('/donations', { sort: '-createdAt' });
  const [isOpen, setIsOpen] = useState(false);
  // Panel revision: residents can cancel a pledge until the barangay has received it.
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);

  const details = (r) => (r.type === 'cash' ? `₱${Number(r.amount || 0).toLocaleString()}` : r.quantity || '—');

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="page-header !mb-0">
          <p className="page-subtitle">{t('donation.subtitle')}</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <FiPlus /> {t('donation.new')}
        </button>
      </div>

      <div className="card animate-fadeIn p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          emptyMessage={t('donation.none')}
          columns={[
            { header: t('donation.reference'), accessor: (r) => r.referenceCode },
            { header: t('donation.type'), accessor: (r) => t(`donation.type.${r.type}`) },
            { header: t('donation.quantity'), accessor: details },
            { header: t('donation.beneficiaryShort'), accessor: (r) => r.beneficiary || '—' },
            { header: t('common.status'), accessor: (r) => <Badge status={r.status} /> },
            { header: t('common.date'), accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy') },
            {
              header: t('common.actions'),
              accessor: (r) =>
                r.status === DONATION_STATUS.PLEDGED ? (
                  <button
                    onClick={() => setCancelling(r)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
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
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={t('donation.formTitle')}>
        <DonationForm
          onSuccess={() => {
            setIsOpen(false);
            refetch();
          }}
        />
      </Modal>

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
