import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler,
);

export const CHART_COLORS = ['#10b981', '#14b8a6', '#22c55e', '#06b6d4', '#34d399', '#0ea5a4', '#84cc16', '#2dd4bf'];

export const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    y: { grid: { color: 'rgba(148,163,184,0.12)' }, ticks: { color: '#94a3b8', font: { size: 11 } }, beginAtZero: true },
  },
};
