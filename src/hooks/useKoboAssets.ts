import { useQuery } from "@tanstack/react-query";
import { fetchKoboAssets, type KoboAssetSummary } from "@/lib/kobo";

export const KOBO_ASSETS_QUERY_KEY = ["kobo", "assets", "list"];

export interface UseKoboAssetsResult {
  data: KoboAssetSummary | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  refetch: () => void;
}

export const useKoboAssets = (): UseKoboAssetsResult => {
  const query = useQuery<KoboAssetSummary, Error>({
    queryKey: KOBO_ASSETS_QUERY_KEY,
    queryFn: fetchKoboAssets,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    isFetching: query.isFetching,
    refetch: () => {
      void query.refetch();
    },
  };
};
