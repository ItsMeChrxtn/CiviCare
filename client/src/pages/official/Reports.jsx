import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiDownload } from 'react-icons/fi';
import api from '../../utils/api';
import TrendLineChart from '../../components/charts/TrendLineChart';
import BreakdownDoughnut from '../../components/charts/BreakdownDoughnut';
import { CardSkeleton } from '../../components/common/Skeleton';

const EXPORT_MODULES = ['incidents', 'documents', 'donations', 'announcements', 'feedback'];

const Reports = () => {
  const [trends, setTrends] = useState(null);
  const [incidentStats, setIncidentStats] = useState(null);
  const [documentStats, setDocumentStats] = useState(null);
  const [donationStats, setDonationStats] = useState(null);
  const [range, setRange] = useState({ from: '', to: '' });

  useEffect(() => {
    api.get('/reports/trends').then(({ data }) => setTrends(data.data));
    api.get('/incidents/stats/overview').then(({ data }) => setIncidentStats(data.data));
    api.get('/documents/stats/overview').then(({ data }) => setDocumentStats(data.data));
    api.get('/donations/stats/overview').then(({ data }) => setDonationStats(data.data));
  }, []);

  const exportExcel = async (moduleName) => {
    try {
      const { data } = await api.get('/reports/export/excel', {
        params: { module: moduleName, ...range },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${moduleName}-report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Failed to export report');
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Reports & Analytics</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Incidents by Status</h2>
          {incidentStats ? <BreakdownDoughnut groups={incidentStats.byStatus} /> : <CardSkeleton />}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Documents by Type</h2>
          {documentStats ? <BreakdownDoughnut groups={documentStats.byType} /> : <CardSkeleton />}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Donations by Type</h2>
          {donationStats ? <BreakdownDoughnut groups={donationStats.byType} /> : <CardSkeleton />}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Monthly Donation Trend</h2>
          {trends ? <TrendLineChart series={trends.donations} label="Donations" color="#f59e0b" /> : <CardSkeleton />}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-bold">Export Reports</h2>
        <div className="mb-4 flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-400">From</label>
            <input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">To</label>
            <input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className="input-field" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {EXPORT_MODULES.map((m) => (
            <button key={m} onClick={() => exportExcel(m)} className="btn-secondary text-sm capitalize">
              <FiDownload /> {m} (Excel)
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
