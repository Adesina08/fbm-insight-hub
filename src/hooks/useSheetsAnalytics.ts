import { useQuery } from "@tanstack/react-query";
import { fetchSheetsAnalytics, type DashboardAnalytics } from "@/lib/googleSheets";

export const SHEETS_ANALYTICS_QUERY_KEY = ["sheets", "analytics"];

export const REFRESH_INTERVAL_MS = 60_000;

export interface UseSheetsAnalyticsResult {
  data: DashboardAnalytics | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
}

export const useSheetsAnalytics = (): UseSheetsAnalyticsResult => {
  const query = useQuery<DashboardAnalytics, Error>({
    queryKey: SHEETS_ANALYTICS_QUERY_KEY,
    queryFn: fetchSheetsAnalytics,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
    staleTime: REFRESH_INTERVAL_MS / 2,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    refetch: () => {
      void query.refetch();
    },
    isFetching: query.isFetching,
  };
};
