import { RefreshCw, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSheetsMetadata } from "@/hooks/useSheetsMetadata";

const formatRelativeTime = (value: string | null): string => {
  if (!value) return "—";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "—";
  return formatDistanceToNow(timestamp, { addSuffix: true });
};

const formatAbsoluteTime = (value: string | null): string | undefined => {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return undefined;
  return new Date(timestamp).toLocaleString();
};

const SheetMetadataCard = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useSheetsMetadata();

  const absoluteLastUpdated = data ? formatAbsoluteTime(data.lastUpdated) : undefined;
  const relativeLastUpdated = data ? formatRelativeTime(data.lastUpdated) : "—";
  const headers = data?.headers ?? [];
  const headerPreview = headers.slice(0, 16);

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Connected Google Sheet</CardTitle>
          <CardDescription>
            Live analytics are sourced from this spreadsheet. Update the sheet to refresh insights in the dashboard.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-6 w-20" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <Alert variant="destructive" className="flex items-start gap-3">
            <div>
              <AlertTitle>Unable to load sheet metadata</AlertTitle>
              <AlertDescription>{error?.message ?? "Unknown error"}</AlertDescription>
            </div>
            <Button variant="secondary" size="sm" onClick={refetch} className="ml-auto">
              Try again
            </Button>
          </Alert>
        ) : !data ? (
          <Alert>
            <AlertTitle>No spreadsheet detected</AlertTitle>
            <AlertDescription>
              Configure GOOGLE_SERVICE_ACCOUNT credentials on the backend to enable the analytics spreadsheet integration.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold">
                {data.title}
                {data.spreadsheetUrl ? (
                  <a
                    href={data.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:text-primary/80"
                    aria-label={`Open ${data.title} in the source spreadsheet`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
              <div className="mt-1 text-xs text-muted-foreground break-all">
                Spreadsheet ID: {data.spreadsheetId}
              </div>
              {data.timeZone ? (
                <div className="text-xs text-muted-foreground">Time zone: {data.timeZone}</div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-card/60 p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last updated</div>
                <div className="mt-1 text-lg font-semibold">{relativeLastUpdated}</div>
                <div className="text-xs text-muted-foreground" title={absoluteLastUpdated}>
                  {absoluteLastUpdated ?? "No timestamp detected"}
                </div>
              </div>
              <div className="rounded-lg border bg-card/60 p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rows analysed</div>
                <div className="mt-1 text-lg font-semibold">{data.totalRows.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Excludes header row</div>
              </div>
              <div className="rounded-lg border bg-card/60 p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Columns detected</div>
                <div className="mt-1 text-lg font-semibold">{data.totalColumns.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Used for analytics mapping</div>
              </div>
            </div>

            {headers.length > 0 ? (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold">Detected columns ({headers.length})</h4>
                  <span className="text-xs text-muted-foreground">Preview of the first mapped headers</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {headerPreview.map((header) => (
                    <Badge key={header} variant="secondary" className="capitalize">
                      {header}
                    </Badge>
                  ))}
                </div>
                {headers.length > headerPreview.length ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    +{headers.length - headerPreview.length} additional column{headers.length - headerPreview.length === 1 ? "" : "s"}
                  </div>
                ) : null}
              </div>
            ) : (
              <Alert className="bg-muted/40">
                <AlertTitle>No headers found</AlertTitle>
                <AlertDescription>
                  The selected range does not contain a header row. Ensure the first row contains column names such as
                  motivation_score and ability_score.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SheetMetadataCard;
