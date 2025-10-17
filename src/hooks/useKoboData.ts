import { useQuery } from "@tanstack/react-query";
import { fetchKoboAnalytics, type DashboardAnalytics } from "@/lib/kobo";

export const KOBO_QUERY_KEY = ["kobo", "analytics"];

export const REFRESH_INTERVAL_MS = 60_000;

export interface UseKoboDataResult {
  data: DashboardAnalytics | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
}

export const useKoboData = (): UseKoboDataResult => {
  const query = useQuery<DashboardAnalytics, Error>({
    queryKey: KOBO_QUERY_KEY,
    queryFn: fetchKoboAnalytics,
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
