import { useEffect, useState } from 'react';
import api from '../../utils/api';
import TrendLineChart from '../../components/charts/TrendLineChart';
import BreakdownDoughnut from '../../components/charts/BreakdownDoughnut';
import { CardSkeleton } from '../../components/common/Skeleton';

const Analytics = () => {
  const [trends, setTrends] = useState(null);
  const [incidentStats, setIncidentStats] = useState(null);
  const [donationStats, setDonationStats] = useState(null);

  useEffect(() => {
    api.get('/reports/trends').then(({ data }) => setTrends(data.data));
    api.get('/incidents/stats/overview').then(({ data }) => setIncidentStats(data.data));
    api.get('/donations/stats/overview').then(({ data }) => setDonationStats(data.data));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Incidents (12 months)</h2>
          {trends ? <TrendLineChart series={trends.incidents} label="Incidents" color="#ef4444" /> : <CardSkeleton />}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Documents Processed (12 months)</h2>
          {trends ? <TrendLineChart series={trends.documents} label="Documents" color="#3b82f6" /> : <CardSkeleton />}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Incidents by Category</h2>
          {incidentStats ? <BreakdownDoughnut groups={incidentStats.byCategory} /> : <CardSkeleton />}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Incidents by Severity</h2>
          {incidentStats ? <BreakdownDoughnut groups={incidentStats.bySeverity} /> : <CardSkeleton />}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Donations by Status</h2>
          {donationStats ? <BreakdownDoughnut groups={donationStats.byStatus} /> : <CardSkeleton />}
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Events Held (12 months)</h2>
          {trends ? <TrendLineChart series={trends.events} label="Events" color="#10b981" /> : <CardSkeleton />}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
