import { useState } from 'react';
import { format } from 'date-fns';
import { FiPlus } from 'react-icons/fi';
import usePaginatedFetch from '../../hooks/usePaginatedFetch';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import DonationForm from '../../components/donation/DonationForm';

const Donations = () => {
  const { rows, meta, params, setPage, isLoading, refetch } = usePaginatedFetch('/donations');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="page-header !mb-0">
          <h1 className="page-title">My Donations</h1>
          <p className="page-subtitle">Pledge and track your contributions to the barangay.</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="btn-primary">
          <FiPlus /> New Pledge
        </button>
      </div>

      <div className="card animate-fadeIn p-5">
        <DataTable
          isLoading={isLoading}
          page={meta.page || params.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          emptyMessage="You haven't made any donation pledges yet."
          columns={[
            { header: 'Reference', accessor: (r) => r.referenceCode },
            { header: 'Type', accessor: (r) => <span className="capitalize">{r.type}</span> },
            { header: 'Details', accessor: (r) => (r.type === 'cash' ? `₱${r.amount}` : r.quantity || '-') },
            { header: 'Status', accessor: (r) => <Badge status={r.status} /> },
            { header: 'Date', accessor: (r) => format(new Date(r.createdAt), 'MMM d, yyyy') },
          ]}
          rows={rows}
        />
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Make a Donation Pledge">
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
