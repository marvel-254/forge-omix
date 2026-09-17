import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { cn } from '../../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

interface ChartDataset {
  label?: string;
  data: Array<number>;
  color?: string;
}

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  type: 'line' | 'bar' | 'pie';
  /** { labels: string[], datasets: [{ label, data, color? }] } */
  data: {
    labels?: Array<string>;
    datasets?: Array<ChartDataset>;
  } | null;
  options?: Record<string, unknown>;
  responsive?: boolean;
}

const PALETTE = [
  '#3b82f6', // primary-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
];

function toChartJsData(
  type: 'line' | 'bar' | 'pie',
  data: ChartProps['data']
) {
  const labels = data?.labels ?? []
  const datasets = data?.datasets ?? []

  if (type === 'pie') {
    // Pie takes a single dataset; its colors are per-slice.
    const values = datasets[0]?.data ?? []
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: values.map((_, i) => PALETTE[i % PALETTE.length]),
          borderWidth: 0,
        },
      ],
    }
  }

  return {
    labels,
    datasets: datasets.map((ds, i) => {
      const color = ds.color ?? PALETTE[i % PALETTE.length]
      if (type === 'line') {
        return {
          label: ds.label,
          data: ds.data,
          borderColor: color,
          backgroundColor: `${color}33`, // 20% alpha fill
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        }
      }
      return {
        label: ds.label,
        data: ds.data,
        backgroundColor: color,
        borderRadius: 4,
      }
    }),
  }
}

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom' as const, labels: { boxWidth: 12 } },
    tooltip: { enabled: true },
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { color: '#e5e7eb' } },
  },
} as const;

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ className, type, data, options, responsive = true, ...props }, ref) => {
    const chartData = useMemo(() => toChartJsData(type, data), [type, data])
    const hasData = (data?.datasets?.length ?? 0) > 0

    const mergedOptions = useMemo(
      () => ({
        ...baseOptions,
        ...(options as object),
      }),
      [options]
    )

    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          responsive ? 'h-full max-w-full min-h-[200px]' : 'h-auto w-auto',
          className
        )}
        {...props}
      >
        {hasData ? (
          type === 'line' ? (
            <Line data={chartData} options={mergedOptions} />
          ) : type === 'bar' ? (
            <Bar data={chartData} options={mergedOptions} />
          ) : (
            <Pie data={chartData} options={mergedOptions} />
          )
        ) : (
          <div className="flex h-full min-h-[200px] w-full items-center justify-center rounded-lg bg-neutral-100">
            <p className="text-sm text-neutral-500">Chart: no data</p>
          </div>
        )}
      </div>
    );
  }
);

Chart.displayName = 'Chart';

export { Chart };
