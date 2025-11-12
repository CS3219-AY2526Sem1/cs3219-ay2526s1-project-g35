/*
 * AI Assistance Disclosure:
 * Tool: ChatGPT/Claude
 * Scope: Implementation of frontend elements and api integration with backend services based on author specified behaviors and figma mockups
 * Author review: All behaviours and components to add specified by Arren11111, all behaviors
 *                tested to function as intended by author
 */

'use client';

import { DowntimeServiceChart } from '@/components/admin/DowntimeServiceChart';
import Header from '@/components/ui/Header';
import { Button } from '@/components/ui/button';
import {
  DowntimeSeriesResponse,
  TimeRange,
  TimeSeriesResponse,
  fetchDowntimeSeries,
  fetchVisitSeries,
} from '@/services/analytics.service';
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
import { useCallback, useEffect, useMemo, useState } from 'react';
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

type RangeOption = {
  value: TimeRange;
  label: string;
};

const RANGE_OPTIONS: RangeOption[] = [
  { value: 'week', label: 'Past Week' },
  { value: 'month', label: 'Past Month' },
  { value: 'year', label: 'Past Year' },
  { value: 'custom', label: 'Specific Month' },
];

const getCurrentMonthString = () => new Date().toISOString().slice(0, 7);

const formatMinutes = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes.toFixed(1)} min`;
  }
  const hours = minutes / 60;
  return `${hours.toFixed(1)} hr`;
};

const SERVICE_COLOR_MAP: Record<string, { line: string; fill: string }> = {
  'user-service': { line: 'rgb(37, 99, 235)', fill: 'rgba(37, 99, 235, 0.15)' },
  'question-service': { line: 'rgb(16, 185, 129)', fill: 'rgba(16, 185, 129, 0.15)' },
  'matching-service': { line: 'rgb(236, 72, 153)', fill: 'rgba(236, 72, 153, 0.18)' },
  'collaboration-service': { line: 'rgb(14, 165, 233)', fill: 'rgba(14, 165, 233, 0.18)' },
  frontend: { line: 'rgb(234, 179, 8)', fill: 'rgba(234, 179, 8, 0.2)' },
};

const FALLBACK_SERVICE_COLORS = { line: 'rgb(148, 163, 184)', fill: 'rgba(148, 163, 184, 0.2)' };

const getServiceColors = (serviceName: string) =>
  SERVICE_COLOR_MAP[serviceName] ?? FALLBACK_SERVICE_COLORS;

const getServiceDisplayName = (serviceName: string) => serviceName.replace(/-/g, ' ');

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'index' as const,
      callbacks: {
        label: (context: TooltipItem<'line'>) => {
          if (typeof context.parsed.y === 'number') {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
          }
          return context.dataset.label;
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

type RangeHeaderProps = {
  title: string;
  description: string;
  range: TimeRange;
  onRangeChange: (value: TimeRange) => void;
  selectedMonth?: string;
  onMonthChange?: (value: string) => void;
};

function RangeHeader({
  title,
  description,
  range,
  onRangeChange,
  selectedMonth,
  onMonthChange,
}: RangeHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={range === option.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onRangeChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        {range === 'custom' && onMonthChange && (
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => onMonthChange(event.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            max={getCurrentMonthString()}
          />
        )}
      </div>
    </div>
  );
}

const ChartSkeleton = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
  </div>
);

type MetricsCardProps = {
  totalLabel: string;
  totalValue: string;
  isLoading: boolean;
  error: string | null;
  children: React.ReactNode;
};

function MetricsCard({ totalLabel, totalValue, isLoading, error, children }: MetricsCardProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">{totalLabel}</p>
        <p className="text-3xl font-semibold">{totalValue}</p>
      </div>
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : isLoading ? (
        <ChartSkeleton />
      ) : (
        <div className="h-64">{children}</div>
      )}
    </div>
  );
}

export default function AdminHomePage() {
  const [visitRange, setVisitRange] = useState<TimeRange>('week');
  const [downtimeRange, setDowntimeRange] = useState<TimeRange>('week');
  const [visitMonth, setVisitMonth] = useState<string>(getCurrentMonthString());
  const [downtimeMonth, setDowntimeMonth] = useState<string>(getCurrentMonthString());

  const [visitData, setVisitData] = useState<TimeSeriesResponse | null>(null);
  const [downtimeData, setDowntimeData] = useState<DowntimeSeriesResponse | null>(null);

  const [visitLoading, setVisitLoading] = useState<boolean>(true);
  const [downtimeLoading, setDowntimeLoading] = useState<boolean>(true);
  const [visitError, setVisitError] = useState<string | null>(null);
  const [downtimeError, setDowntimeError] = useState<string | null>(null);

  const loadVisitSeries = useCallback(async () => {
    if (visitRange === 'custom' && !visitMonth) {
      return;
    }

    setVisitLoading(true);
    setVisitError(null);
    try {
      const data = await fetchVisitSeries(
        visitRange,
        visitRange === 'custom' ? visitMonth : undefined,
      );
      setVisitData(data);
    } catch (error) {
      console.error('Failed to load visit analytics:', error);
      setVisitError('Unable to load visit analytics. Please try again.');
    } finally {
      setVisitLoading(false);
    }
  }, [visitRange, visitMonth]);

  const loadDowntimeSeries = useCallback(async () => {
    if (downtimeRange === 'custom' && !downtimeMonth) {
      return;
    }

    setDowntimeLoading(true);
    setDowntimeError(null);
    try {
      const data = await fetchDowntimeSeries(
        downtimeRange,
        downtimeRange === 'custom' ? downtimeMonth : undefined,
      );
      setDowntimeData(data);
    } catch (error) {
      console.error('Failed to load downtime analytics:', error);
      setDowntimeError('Unable to load downtime analytics. Please try again.');
    } finally {
      setDowntimeLoading(false);
    }
  }, [downtimeRange, downtimeMonth]);

  useEffect(() => {
    loadVisitSeries();
  }, [loadVisitSeries]);

  useEffect(() => {
    loadDowntimeSeries();
  }, [loadDowntimeSeries]);

  const visitChartData = useMemo(() => {
    if (!visitData) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: visitData.buckets.map((bucket) => bucket.label),
      datasets: [
        {
          label: 'Site Visits',
          data: visitData.buckets.map((bucket) => bucket.value),
          borderColor: 'rgb(79, 70, 229)',
          backgroundColor: 'rgba(79, 70, 229, 0.15)',
          tension: 0.3,
          fill: true,
          pointRadius: 3,
        },
      ],
    };
  }, [visitData]);

  const serviceSeries = useMemo(() => {
    if (!downtimeData?.serviceSeries) {
      return [] as DowntimeSeriesResponse['serviceSeries'];
    }

    return [...downtimeData.serviceSeries].sort((a, b) =>
      a.serviceName.localeCompare(b.serviceName),
    );
  }, [downtimeData]);

  const visitTotal = visitData?.total ?? 0;
  const downtimeTotalMinutes = downtimeData?.totalMinutes ?? 0;
  const hasServiceSeries = serviceSeries.length > 0;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 text-center">
        <Header className="mb-2">Administrator Dashboard</Header>
        <p className="text-muted-foreground">
          Monitor site engagement and system health in real time.
        </p>
      </div>

      <div className="space-y-10">
        <div className="space-y-4">
          <RangeHeader
            title="Number of Site Visits"
            description="Total successful page visits across the platform"
            range={visitRange}
            onRangeChange={(value) => {
              setVisitRange(value);
              if (value === 'custom' && !visitMonth) {
                setVisitMonth(getCurrentMonthString());
              }
            }}
            selectedMonth={visitMonth}
            onMonthChange={setVisitMonth}
          />
          <MetricsCard
            totalLabel="Total visits"
            totalValue={visitTotal.toLocaleString()}
            isLoading={visitLoading}
            error={visitError}
          >
            <Line options={chartOptions} data={visitChartData} />
          </MetricsCard>
        </div>

        <div className="space-y-4">
          <RangeHeader
            title="Total System Downtime"
            description="Aggregate number of minutes services were unavailable"
            range={downtimeRange}
            onRangeChange={(value) => {
              setDowntimeRange(value);
              if (value === 'custom' && !downtimeMonth) {
                setDowntimeMonth(getCurrentMonthString());
              }
            }}
            selectedMonth={downtimeMonth}
            onMonthChange={setDowntimeMonth}
          />

          <p className="text-sm text-muted-foreground">
            Total downtime across all services:{' '}
            <span className="font-semibold text-foreground">
              {formatMinutes(downtimeTotalMinutes)}
            </span>
          </p>

          {downtimeError && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {downtimeError}
            </div>
          )}

          {downtimeLoading && !hasServiceSeries && <ChartSkeleton />}

          {hasServiceSeries ? (
            <div className="grid gap-6 md:grid-cols-2">
              {serviceSeries.map((series) => {
                const colors = getServiceColors(series.serviceName);
                const displayName = getServiceDisplayName(series.serviceName);

                return (
                  <MetricsCard
                    key={series.serviceName}
                    totalLabel={`${displayName} downtime`}
                    totalValue={formatMinutes(series.totalMinutes)}
                    isLoading={downtimeLoading}
                    error={downtimeError}
                  >
                    <DowntimeServiceChart
                      serviceLabel={displayName}
                      buckets={series.buckets}
                      lineColor={colors.line}
                      fillColor={colors.fill}
                    />
                  </MetricsCard>
                );
              })}
            </div>
          ) : null}

          {!downtimeLoading && !downtimeError && !hasServiceSeries && (
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
              No downtime recorded for the selected range.
            </div>
          )}

          {downtimeData && downtimeData.serviceBreakdown.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h4 className="mb-4 text-base font-semibold">Downtime by Service</h4>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {downtimeData.serviceBreakdown.map((item) => (
                  <div
                    key={item.serviceName}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2"
                  >
                    <dt className="text-sm font-medium capitalize">
                      {item.serviceName.replace(/-/g, ' ')}
                    </dt>
                    <dd className="text-sm text-muted-foreground">{formatMinutes(item.minutes)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
