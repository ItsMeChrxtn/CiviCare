import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiDownload, FiBarChart2, FiCalendar } from 'react-icons/fi';
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
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="page-subtitle">Barangay-wide trends and exportable records.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card card-hover animate-fadeIn p-5">
          <h2 className="mb-4 flex items-center gap-1.5 font-display font-bold text-gray-900 dark:text-gray-50">
            <FiBarChart2 className="h-4 w-4 text-primary-500" /> Incidents by Status
          </h2>
          {incidentStats ? <BreakdownDoughnut groups={incidentStats.byStatus} /> : <CardSkeleton />}
        </div>
        <div className="card card-hover animate-fadeIn p-5">
          <h2 className="mb-4 flex items-center gap-1.5 font-display font-bold text-gray-900 dark:text-gray-50">
            <FiBarChart2 className="h-4 w-4 text-primary-500" /> Documents by Type
          </h2>
          {documentStats ? <BreakdownDoughnut groups={documentStats.byType} /> : <CardSkeleton />}
        </div>
        <div className="card card-hover animate-fadeIn p-5">
          <h2 className="mb-4 flex items-center gap-1.5 font-display font-bold text-gray-900 dark:text-gray-50">
            <FiBarChart2 className="h-4 w-4 text-primary-500" /> Donations by Type
          </h2>
          {donationStats ? <BreakdownDoughnut groups={donationStats.byType} /> : <CardSkeleton />}
        </div>
        <div className="card card-hover animate-fadeIn p-5">
          <h2 className="mb-4 flex items-center gap-1.5 font-display font-bold text-gray-900 dark:text-gray-50">
            <FiBarChart2 className="h-4 w-4 text-primary-500" /> Monthly Donation Trend
          </h2>
          {trends ? <TrendLineChart series={trends.donations} label="Donations" color="#f59e0b" /> : <CardSkeleton />}
        </div>
      </div>

      <div className="card animate-fadeIn p-6">
        <h2 className="mb-4 flex items-center gap-1.5 font-display font-bold text-gray-900 dark:text-gray-50">
          <FiDownload className="h-4 w-4 text-primary-500" /> Export Reports
        </h2>
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl bg-gray-50/80 p-4 dark:bg-gray-900/40">
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <FiCalendar className="h-3 w-3" /> From
            </label>
            <input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <FiCalendar className="h-3 w-3" /> To
            </label>
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
