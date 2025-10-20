import { useQuery } from "@tanstack/react-query";
import { fetchSheetsMetadata, type SheetMetadataSummary } from "@/lib/googleSheets";

export const SHEETS_METADATA_QUERY_KEY = ["sheets", "metadata", "summary"];

export interface UseSheetsMetadataResult {
  data: SheetMetadataSummary | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  refetch: () => void;
}

export const useSheetsMetadata = (): UseSheetsMetadataResult => {
  const query = useQuery<SheetMetadataSummary, Error>({
    queryKey: SHEETS_METADATA_QUERY_KEY,
    queryFn: fetchSheetsMetadata,
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
