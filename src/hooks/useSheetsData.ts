import { useQuery } from "@tanstack/react-query";
import { fetchSheetsAnalytics, type DashboardAnalytics } from "@/lib/sheets";

export const SHEETS_QUERY_KEY = ["sheets", "analytics"];

export const REFRESH_INTERVAL_MS = 60_000;

export interface UseSheetsDataResult {
  data: DashboardAnalytics | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
}

export const useSheetsData = (): UseSheetsDataResult => {
  const query = useQuery<DashboardAnalytics, Error>({
    queryKey: SHEETS_QUERY_KEY,
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
