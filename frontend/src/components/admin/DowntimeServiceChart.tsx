'use client';

import { TimeSeriesBucket } from '@/services/analytics.service';
import {
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  TooltipItem,
} from 'chart.js';
import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

type DowntimeServiceChartProps = {
  serviceLabel: string;
  buckets: TimeSeriesBucket[];
  lineColor: string;
  fillColor: string;
};

const baseOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'index',
      callbacks: {
        label: (context: TooltipItem<'line'>) => {
          if (typeof context.parsed.y === 'number') {
            const minutes = context.parsed.y;
            if (minutes < 60) {
              return `${context.dataset.label}: ${minutes.toFixed(1)} min`;
            }
            const hours = minutes / 60;
            return `${context.dataset.label}: ${hours.toFixed(1)} hr`;
          }
          return context.dataset.label ?? '';
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 6,
      },
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
    },
  },
};

export function DowntimeServiceChart({
  serviceLabel,
  buckets,
  lineColor,
  fillColor,
}: DowntimeServiceChartProps) {
  const data = useMemo(() => {
    return {
      labels: buckets.map((bucket) => bucket.label),
      datasets: [
        {
          label: `${serviceLabel} downtime`,
          data: buckets.map((bucket) => bucket.value),
          borderColor: lineColor,
          backgroundColor: fillColor,
          tension: 0.3,
          fill: true,
          pointRadius: 3,
        },
      ],
    };
  }, [buckets, fillColor, lineColor, serviceLabel]);

  return <Line options={baseOptions} data={data} />;
}
