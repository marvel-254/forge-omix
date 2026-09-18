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
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
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

export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'area';

/**
 * Ordered series colors. When a chart is driven from the canvas registry the
 * palette is derived from the project's design tokens (see deriveChartPalette);
 * `undefined` falls back to the built-in defaults below.
 */
export type ChartPalette = Array<string> | undefined;

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  type: ChartType;
  /** { labels: string[], datasets: [{ label, data, color? }] } */
  data: {
    labels?: Array<string>;
    datasets?: Array<ChartDataset>;
  } | null;
  options?: Record<string, unknown>;
  responsive?: boolean;
  /** Token-derived series colors; positional (series i uses palette[i]). */
  palette?: ChartPalette;
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
  type: ChartType,
  data: ChartProps['data'],
  palette: ChartPalette = undefined
) {
  const seriesColors = palette && palette.length > 0 ? palette : PALETTE
  const labels = data?.labels ?? []
  const datasets = data?.datasets ?? []

  if (type === 'pie' || type === 'doughnut') {
    // Pie/doughnut take a single dataset; its colors are per-slice.
    const values = datasets[0]?.data ?? []
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: values.map((_, i) => seriesColors[i % seriesColors.length]),
          borderWidth: 0,
        },
      ],
    }
  }

  return {
    labels,
    datasets: datasets.map((ds, i) => {
      const color = ds.color ?? seriesColors[i % seriesColors.length]
      // `area` is a line chart with the (already configured) alpha fill.
      if (type === 'line' || type === 'area') {
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
  ({ className, type, data, options, responsive = true, palette, ...props }, ref) => {
    const chartData = useMemo(() => toChartJsData(type, data, palette), [type, data, palette])
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
          type === 'line' || type === 'area' ? (
            <Line data={chartData} options={mergedOptions} />
          ) : type === 'bar' ? (
            <Bar data={chartData} options={mergedOptions} />
          ) : type === 'doughnut' ? (
            <Doughnut data={chartData} options={mergedOptions} />
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
