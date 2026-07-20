import { Line } from 'react-chartjs-2';
import './chartSetup';
import { baseOptions } from './chartSetup';

/** series: [{ _id: 'YYYY-MM', count: number }] as returned by /reports/trends */
const TrendLineChart = ({ series = [], label = 'Total', color = '#0f766e' }) => {
  const data = {
    labels: series.map((s) => s._id),
    datasets: [
      {
        label,
        data: series.map((s) => s.count),
        borderColor: color,
        backgroundColor: `${color}33`,
        tension: 0.35,
        fill: true,
        pointRadius: 3,
      },
    ],
  };

  return (
    <div className="h-64">
      <Line data={data} options={baseOptions} />
    </div>
  );
};

export default TrendLineChart;
