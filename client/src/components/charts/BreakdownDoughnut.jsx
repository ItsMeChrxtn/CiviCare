import { Doughnut } from 'react-chartjs-2';
import './chartSetup';
import { baseOptions, CHART_COLORS } from './chartSetup';

/** groups: [{ _id: 'category', count: number }] as returned by aggregate $group endpoints */
const BreakdownDoughnut = ({ groups = [] }) => {
  const data = {
    labels: groups.map((g) => (g._id || 'unspecified').replace(/_/g, ' ')),
    datasets: [
      {
        data: groups.map((g) => g.count),
        backgroundColor: CHART_COLORS,
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="h-64">
      <Doughnut data={data} options={baseOptions} />
    </div>
  );
};

export default BreakdownDoughnut;
