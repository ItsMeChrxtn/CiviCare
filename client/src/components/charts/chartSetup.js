import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registered once, imported by every chart component so Chart.js elements
// (line/bar/doughnut) are never re-registered per page.
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export const CHART_COLORS = ['#0f766e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981', '#ec4899', '#6b7280'];

export const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16 } } },
};
