import { useMemo } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useSheetsMetadata } from "@/hooks/useSheetsMetadata";

const formatLabel = (value: string): string =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || value;

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

const SheetsConnectionPanel = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useSheetsMetadata();

  const emptyState = useMemo(() => !isLoading && data.length === 0, [data.length, isLoading]);

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Google Sheets connection</CardTitle>
          <CardDescription>
            Spreadsheets available to the configured Google Sheets credentials. Select a spreadsheet ID to power live analytics.
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
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-5 items-center">
                <Skeleton className="h-6 w-full md:col-span-2" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <Alert variant="destructive" className="flex items-start gap-3">
            <div>
              <AlertTitle>Unable to load Google Sheets metadata</AlertTitle>
              <AlertDescription>{error?.message ?? "Unknown error"}</AlertDescription>
            </div>
            <Button variant="secondary" size="sm" onClick={refetch} className="ml-auto">
              Try again
            </Button>
          </Alert>
        ) : emptyState ? (
          <Alert>
            <AlertTitle>No Sheets detected</AlertTitle>
            <AlertDescription>
              Confirm that <code>VITE_SHEETS_SPREADSHEET_ID</code> and the service account credentials are set. The dashboard will
              list each worksheet once the proxy can reach Google Sheets.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spreadsheet</TableHead>
                  <TableHead>Worksheet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead>Last sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((asset) => {
                  const lastSubmission = formatRelativeTime(asset.lastSubmissionTime);
                  const lastSubmissionTitle = formatAbsoluteTime(asset.lastSubmissionTime);
                  const modifiedRelative = formatRelativeTime(asset.dateModified);
                  const modifiedTitle = formatAbsoluteTime(asset.dateModified);
                  return (
                    <TableRow key={asset.uid} className="bg-card/60">
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                          {asset.name}
                          {asset.url ? (
                            <a
                              href={asset.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:text-primary/80"
                              aria-label={`Open ${asset.name} in Google Sheets`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Spreadsheet ID: {asset.uid}
                          {asset.ownerUsername ? ` · Owner: ${asset.ownerUsername}` : ""}
                          {asset.tagString ? ` · Labels: ${asset.tagString}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{formatLabel(asset.assetType)}</Badge>
                          {asset.deploymentStatus ? (
                            <Badge variant="outline" className="capitalize">
                              {formatLabel(asset.deploymentStatus)}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={asset.status === "shared" || asset.status === "connected" ? "default" : "outline"} className="capitalize">
                            {formatLabel(asset.status)}
                          </Badge>
                          {!asset.hasDeployment ? <Badge variant="outline">Link inactive</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold">{asset.submissionCount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground" title={lastSubmissionTitle}>
                          {asset.submissionCount > 0 ? `Updated ${lastSubmission}` : "No rows synced"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm" title={modifiedTitle}>
                          {modifiedRelative}
                        </div>
                        {asset.dateDeployed ? (
                          <div
                            className="text-xs text-muted-foreground"
                            title={formatAbsoluteTime(asset.dateDeployed)}
                          >
                            Connected {formatRelativeTime(asset.dateDeployed)}
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <p className="mt-4 text-sm text-muted-foreground">
              Need to switch spreadsheets? Update <code>VITE_SHEETS_SPREADSHEET_ID</code> and refresh to pull the latest worksheet metadata.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SheetsConnectionPanel;
