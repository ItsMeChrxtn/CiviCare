import { useState } from 'react';
import { format } from 'date-fns';
import { FiPlus } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import { usePreferences } from '../../contexts/PreferencesContext';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import DonationForm from '../../components/donation/DonationForm';

const Donations = () => {
  const { t } = usePreferences();
  const { rows, meta, params, setPage, isLoading, refetch } = usePaginatedFetch('/donations', { sort: '-createdAt' });
  const [isOpen, setIsOpen] = useState(false);

  const details = (r) => (r.type === 'cash' ? `₱${Number(r.amount || 0).toLocaleString()}` : r.quantity || '—');

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
    </div>
  );
};

export default Donations;
