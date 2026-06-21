import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler,
);

// UCP palette: crimson, gold, navy + supporting tones
export const CHART_COLORS = ['#b21e3f', '#e0a92e', '#23355c', '#d64d6a', '#7a8aa8', '#8c1530', '#f0c75e', '#3f5681'];

export const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    y: { grid: { color: 'rgba(148,163,184,0.12)' }, ticks: { color: '#94a3b8', font: { size: 11 } }, beginAtZero: true },
  },
};
