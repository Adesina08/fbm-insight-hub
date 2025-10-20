import { useQuery } from "@tanstack/react-query";
import { fetchSheetsAssets, type SheetsAssetSummary } from "@/lib/sheets";

export const SHEETS_ASSETS_QUERY_KEY = ["sheets", "metadata", "list"];

export interface UseSheetsMetadataResult {
  data: SheetsAssetSummary[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  refetch: () => void;
}

export const useSheetsMetadata = (): UseSheetsMetadataResult => {
  const query = useQuery<SheetsAssetSummary[], Error>({
    queryKey: SHEETS_ASSETS_QUERY_KEY,
    queryFn: fetchSheetsAssets,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    isFetching: query.isFetching,
    refetch: () => {
      void query.refetch();
    },
  };
};
