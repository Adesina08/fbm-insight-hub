import { useMemo } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useKoboAssets } from "@/hooks/useKoboAssets";
import { formatDistanceToNow } from "date-fns";

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

const KoboAssetList = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useKoboAssets();

  const emptyState = useMemo(() => !isLoading && data.length === 0, [data.length, isLoading]);

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Connected Kobo Projects</CardTitle>
          <CardDescription>
            Assets accessible with the configured Kobo API token. Select a project UID to use for live analytics.
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
              <AlertTitle>Unable to load Kobo assets</AlertTitle>
              <AlertDescription>{error?.message ?? "Unknown error"}</AlertDescription>
            </div>
            <Button variant="secondary" size="sm" onClick={refetch} className="ml-auto">
              Try again
            </Button>
          </Alert>
        ) : emptyState ? (
          <Alert>
            <AlertTitle>No projects detected</AlertTitle>
            <AlertDescription>
              Your Kobo token is valid but no assets are available yet. Create a form in Kobo or request access to an
              existing project, then refresh this list.
            </AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Type &amp; Deployment</TableHead>
                <TableHead>Sharing</TableHead>
                <TableHead className="text-right">Submissions</TableHead>
                <TableHead>Last activity</TableHead>
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
                            aria-label={`Open ${asset.name} in Kobo`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        UID: {asset.uid}
                        {asset.ownerUsername ? ` · Owner: ${asset.ownerUsername}` : ""}
                        {asset.tagString ? ` · Tags: ${asset.tagString}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{formatLabel(asset.assetType)}</Badge>
                        <Badge variant={asset.deploymentStatus === "deployed" ? "default" : "outline"} className="capitalize">
                          {formatLabel(asset.deploymentStatus)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={asset.status === "shared" ? "default" : "outline"} className="capitalize">
                          {formatLabel(asset.status)}
                        </Badge>
                        {!asset.hasDeployment ? (
                          <Badge variant="outline">Not deployed</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-semibold">{asset.submissionCount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground" title={lastSubmissionTitle}>
                        {asset.submissionCount > 0 ? lastSubmission : "No submissions"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm" title={modifiedTitle}>
                        {modifiedRelative}
                      </div>
                      {asset.dateDeployed ? (
                        <div className="text-xs text-muted-foreground" title={formatAbsoluteTime(asset.dateDeployed)}>
                          Deployed {formatRelativeTime(asset.dateDeployed)}
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default KoboAssetList;
