import { useEffect, useState } from 'react';
import { FiActivity, FiFileText, FiPieChart, FiAlertTriangle, FiCalendar } from 'react-icons/fi';
import api from '../../utils/api';
import TrendLineChart from '../../components/charts/TrendLineChart';
import BreakdownDoughnut from '../../components/charts/BreakdownDoughnut';
import { CardSkeleton } from '../../components/common/Skeleton';

const Analytics = () => {
  const [trends, setTrends] = useState(null);
  const [incidentStats, setIncidentStats] = useState(null);
  const [documentStats, setDocumentStats] = useState(null);

  useEffect(() => {
    api.get('/reports/trends').then(({ data }) => setTrends(data.data));
    api.get('/incidents/stats/overview').then(({ data }) => setIncidentStats(data.data));
    api.get('/documents/stats/overview').then(({ data }) => setDocumentStats(data.data));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics Dashboard</h1>
        <p className="page-subtitle">System-wide trends and breakdowns across the last 12 months.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card animate-fadeIn p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-gray-800 dark:text-gray-100">
            <FiActivity className="h-4 w-4 text-red-500" /> Incidents (12 months)
          </h2>
          {trends ? <TrendLineChart series={trends.incidents} label="Incidents" color="#ef4444" /> : <CardSkeleton />}
        </div>
        <div className="card animate-fadeIn p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-gray-800 dark:text-gray-100">
            <FiFileText className="h-4 w-4 text-teal-500" /> Documents Processed (12 months)
          </h2>
          {trends ? <TrendLineChart series={trends.documents} label="Documents" color="#3b82f6" /> : <CardSkeleton />}
        </div>
        <div className="card animate-fadeIn p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-gray-800 dark:text-gray-100">
            <FiPieChart className="h-4 w-4 text-primary-500" /> Incidents by Category
          </h2>
          {incidentStats ? <BreakdownDoughnut groups={incidentStats.byCategory} /> : <CardSkeleton />}
        </div>
        <div className="card animate-fadeIn p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-gray-800 dark:text-gray-100">
            <FiAlertTriangle className="h-4 w-4 text-amber-500" /> Incidents by Severity
          </h2>
          {incidentStats ? <BreakdownDoughnut groups={incidentStats.bySeverity} /> : <CardSkeleton />}
        </div>
        <div className="card animate-fadeIn p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-gray-800 dark:text-gray-100">
            <FiFileText className="h-4 w-4 text-rose-500" /> Service Requests by Status
          </h2>
          {documentStats ? <BreakdownDoughnut groups={documentStats.byStatus} /> : <CardSkeleton />}
        </div>
        <div className="card animate-fadeIn p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-gray-800 dark:text-gray-100">
            <FiCalendar className="h-4 w-4 text-emerald-500" /> Events Held (12 months)
          </h2>
          {trends ? <TrendLineChart series={trends.events} label="Events" color="#10b981" /> : <CardSkeleton />}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
