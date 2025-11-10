import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export type TimeRange = 'week' | 'month' | 'year' | 'custom';

export type TimeSeriesBucket = {
  label: string;
  value: number;
  raw: string;
};

export type TimeSeriesResponse = {
  range: TimeRange;
  startDate: string;
  endDate: string;
  total: number;
  buckets: TimeSeriesBucket[];
};

export type ServiceDowntimeSeries = {
  serviceName: string;
  totalMinutes: number;
  buckets: TimeSeriesBucket[];
};

export type DowntimeSeriesResponse = {
  range: TimeRange;
  startDate: string;
  endDate: string;
  totalMinutes: number;
  buckets: TimeSeriesBucket[];
  serviceBreakdown: { serviceName: string; minutes: number }[];
  serviceSeries: ServiceDowntimeSeries[];
};

export type RecordSiteVisitPayload = {
  visitType: string;
  path?: string;
  metadata?: Record<string, unknown>;
};

const ANALYTICS_BASE_URL = process.env.NEXT_PUBLIC_ANALYTICS_SERVICE_URL ?? 'http://localhost:8005';

const analyticsClient = axios.create({
  baseURL: ANALYTICS_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

analyticsClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error: AxiosError) => Promise.reject(error),
);

analyticsClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const isPublicAuthPage =
        currentPath === '/login' || currentPath === '/signup' || currentPath === '/resetpassword';

      if (!isPublicAuthPage) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);
const ADMIN_BASE_PATH = '/analytics/admin';
const PUBLIC_BASE_PATH = '/analytics';

export async function recordSiteVisit(payload: RecordSiteVisitPayload): Promise<void> {
  await analyticsClient.post(`${PUBLIC_BASE_PATH}/visits`, payload);
}

export async function fetchVisitSeries(
  range: TimeRange,
  month?: string,
): Promise<TimeSeriesResponse> {
  const params = new URLSearchParams({ range });
  if (range === 'custom' && month) {
    params.append('month', month);
  }

  const response = await analyticsClient.get<{ success: boolean; data: TimeSeriesResponse }>(
    `${ADMIN_BASE_PATH}/visits?${params.toString()}`,
  );

  const { data } = response.data;
  return {
    ...data,
    startDate: data.startDate,
    endDate: data.endDate,
    total: data.total,
  };
}

export async function fetchDowntimeSeries(
  range: TimeRange,
  month?: string,
): Promise<DowntimeSeriesResponse> {
  const params = new URLSearchParams({ range });
  if (range === 'custom' && month) {
    params.append('month', month);
  }

  const response = await analyticsClient.get<{ success: boolean; data: DowntimeSeriesResponse }>(
    `${ADMIN_BASE_PATH}/downtime?${params.toString()}`,
  );

  return response.data.data;
}
