import { type ChangeEvent, useId, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Target,
  Loader2,
  BookOpen,
  Compass,
  Flame,
  GraduationCap,
  Layers,
  LineChart,
  Map as MapIcon,
  Sparkles,
} from "lucide-react";
import DashboardOverview, { type DashboardOverviewMetadata } from "@/components/dashboard/DashboardOverview";
import FBMQuadrantChart from "@/components/dashboard/FBMQuadrantChart";
import FBMQuadrantDistribution from "@/components/dashboard/FBMQuadrantDistribution";
import FBMSegmentHighlights from "@/components/dashboard/FBMSegmentHighlights";
import SegmentProfiles from "@/components/dashboard/SegmentProfiles";
import PromptEffectivenessHeatmap from "@/components/dashboard/PromptEffectivenessHeatmap";
import PathDiagram from "@/components/dashboard/PathDiagram";
import PDFExportButton from "@/components/dashboard/PDFExportButton";
import ExecutivePrintReport from "@/components/dashboard/ExecutivePrintReport";
import {
  CategoryDistributionChart,
  CrossTabUseChart,
  LikertDistributionChart,
} from "@/components/dashboard/FrequencyCharts";
import { useSheetsAnalytics } from "@/hooks/useSheetsAnalytics";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { parseUploadedDataset } from "@/lib/uploadAnalytics";
import type { DashboardAnalytics } from "@/lib/googleSheets";
import { formatLastUpdated } from "@/lib/dashboardFormatters";

type DataMode = "live" | "upload";

interface ComputeSyncStatusOptions {
  dataMode: DataMode | null;
  errorMessage: string | null;
  isError: boolean;
  isFetching: boolean;
  isLoading: boolean;
  isProcessingUpload: boolean;
  uploadError: string | null;
  uploadedAnalytics: DashboardAnalytics | null;
  uploadedFile: File | null;
  uploadSummary: { rowCount: number } | null;
}

const computeSyncStatus = ({
  dataMode,
  errorMessage,
  isError,
  isFetching,
  isLoading,
  isProcessingUpload,
  uploadError,
  uploadedAnalytics,
  uploadedFile,
  uploadSummary,
}: ComputeSyncStatusOptions): string => {
  if (!dataMode) {
    return "Select a data source to begin";
  }

  if (dataMode === "upload") {
    if (isProcessingUpload) {
      return "Processing uploaded dataset…";
    }
    if (uploadError) {
      return `Upload error: ${uploadError}`;
    }
    if (uploadedAnalytics && uploadSummary?.rowCount) {
      return `Using uploaded dataset (${uploadSummary.rowCount} records)`;
    }
    return uploadedFile ? `Using uploaded file: ${uploadedFile.name}` : "Awaiting uploaded dataset";
  }

  if (isLoading) return "Connecting to data source…";
  if (isFetching) return "Syncing latest submissions…";
  if (isError) return errorMessage ?? "Sync error";
  return "Live data from connected source";
};

interface ComputeOverviewMetadataOptions {
  dataMode: DataMode | null;
  isProcessingUpload: boolean;
  uploadSummary: { rowCount: number } | null;
  uploadedAnalytics: DashboardAnalytics | null;
  uploadedFile: File | null;
}

const computeOverviewMetadata = ({
  dataMode,
  isProcessingUpload,
  uploadSummary,
  uploadedAnalytics,
  uploadedFile,
}: ComputeOverviewMetadataOptions): DashboardOverviewMetadata | null | undefined => {
  if (!dataMode) {
    return null;
  }

  if (dataMode === "upload") {
    if (uploadedAnalytics && uploadSummary?.rowCount) {
      return {
        primary: `Uploaded dataset analysed (${new Intl.NumberFormat().format(uploadSummary.rowCount)} records)`,
        secondary: uploadedFile ? `Source file: ${uploadedFile.name}` : undefined,
      } satisfies DashboardOverviewMetadata;
    }

    if (uploadedFile) {
      return {
        primary: `Source file: ${uploadedFile.name}`,
        secondary: isProcessingUpload ? "Processing uploaded dataset…" : "Awaiting dataset parsing.",
      } satisfies DashboardOverviewMetadata;
    }

    return {
      primary: "Awaiting uploaded dataset",
    } satisfies DashboardOverviewMetadata;
  }

  return undefined;
};

interface ComputeIsPdfDisabledOptions {
  analytics: DashboardAnalytics | null;
  isFetching: boolean;
  isLiveMode: boolean;
  isLoading: boolean;
  isProcessingUpload: boolean;
}

const computeIsPdfDisabled = ({
  analytics,
  isFetching,
  isLiveMode,
  isLoading,
  isProcessingUpload,
}: ComputeIsPdfDisabledOptions): boolean => {
  if (!analytics) {
    return true;
  }

  if (isLiveMode) {
    return isLoading || isFetching;
  }

  return isProcessingUpload;
};

interface RequirementCardProps {
  title: string;
  description?: string;
  bullets: string[];
}

const RequirementCard = ({ title, description, bullets }: RequirementCardProps) => (
  <Card className="bg-card/60 border-dashed">
    <CardHeader className="space-y-2">
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      {description ? <CardDescription>{description}</CardDescription> : null}
    </CardHeader>
    <CardContent>
      <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        {bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const Index = () => {

  const [activeTab, setActiveTab] = useState("demographics");
  const dataSourceId = useId();
  const liveModeId = `${dataSourceId}-live`;
  const uploadModeId = `${dataSourceId}-upload`;
  const [dataMode, setDataMode] = useState<DataMode | null>(null);
  const [pendingMode, setPendingMode] = useState<DataMode | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedAnalytics, setUploadedAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<{ rowCount: number } | null>(null);
  const isLiveMode = dataMode === "live";
  const { data, isLoading, isError, error, refetch, isFetching } = useSheetsAnalytics({
    enabled: isLiveMode,
  });
  const reportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncStatus = computeSyncStatus({
    dataMode,
    errorMessage: error?.message ?? null,
    isError,
    isFetching,
    isLoading,
    isProcessingUpload,
    uploadError,
    uploadedAnalytics,
    uploadedFile,
    uploadSummary,
  });

  const analytics: DashboardAnalytics | null = isLiveMode ? data ?? null : uploadedAnalytics;

  const overviewMetadata = computeOverviewMetadata({
    dataMode,
    isProcessingUpload,
    uploadSummary,
    uploadedAnalytics,
    uploadedFile,
  });

  const lastSyncLabel = formatLastUpdated(analytics?.lastUpdated);

  const handleConfirmMode = () => {
    if (pendingMode === "live" || pendingMode === "upload") {
      setDataMode(pendingMode);
      if (pendingMode === "live") {
        setUploadedFile(null);
        setUploadedAnalytics(null);
        setUploadError(null);
        setUploadSummary(null);
        setIsProcessingUpload(false);
      }
      setPendingMode(null);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setUploadError(null);
    setUploadSummary(null);
    setUploadedAnalytics(null);
    setUploadedFile(file);
    // Allow re-uploading the same file by resetting the input value
    event.target.value = "";
    if (!file) {
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension && extension !== "csv") {
      setUploadError("Only CSV files are supported at the moment. Please upload a .csv export.");
      setUploadedFile(null);
      return;
    }

    setIsProcessingUpload(true);
    try {
      const result = await parseUploadedDataset(file);
      setUploadedAnalytics(result.analytics);
      setUploadSummary({ rowCount: result.rowCount });
    } catch (parseError) {
      const message =
        parseError instanceof Error && parseError.message
          ? parseError.message
          : "We couldn't process that file. Please check the format and try again.";
      setUploadError(message);
      setUploadedFile(null);
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const isPdfDisabled = computeIsPdfDisabled({
    analytics,
    isFetching,
    isLiveMode,
    isLoading,
    isProcessingUpload,
  });

  const isAnalyticsLoading = isLiveMode ? (isLoading || isFetching) : isProcessingUpload;
  const analyticsError = isLiveMode && isError ? error?.message ?? "Unable to load analytics data." : null;
  const retryHandler = isLiveMode ? refetch : undefined;

  const descriptiveSubmissions = analytics?.descriptive?.submissions ?? [];

  const buildCategoryCounts = useMemo(
    () =>
      function buildCategoryCounts(getValue: (record: (typeof descriptiveSubmissions)[number]) => string | null | undefined) {
        const counts = new Map<string, number>();
        descriptiveSubmissions.forEach((record) => {
          const value = getValue(record) ?? "Unknown";
          counts.set(value, (counts.get(value) ?? 0) + 1);
        });
        return Array.from(counts.entries())
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count);
      },
    [descriptiveSubmissions],
  );

  const buildLikertCounts = useMemo(
    () =>
      function buildLikertCounts(values: Array<number | null | undefined>) {
        const baseBuckets = new Map<string, number>([
          ["1", 0],
          ["2", 0],
          ["3", 0],
          ["4", 0],
          ["5", 0],
          ["Missing", 0],
        ]);

        values.forEach((value) => {
          if (value == null || Number.isNaN(value)) {
            baseBuckets.set("Missing", (baseBuckets.get("Missing") ?? 0) + 1);
            return;
          }
          const bucket = Math.min(5, Math.max(1, Math.round(value))).toString();
          baseBuckets.set(bucket, (baseBuckets.get(bucket) ?? 0) + 1);
        });

        return Array.from(baseBuckets.entries())
          .map(([bucket, count]) => ({ bucket, count }))
          .filter((item) => item.count > 0);
      },
    [],
  );

  const behaviorVariationData = useMemo(() => {
    const submissionsWithUse = descriptiveSubmissions.filter((record) => record.currentUse != null);

    const computeRate = (
      label: string,
      getLevel: (value: number | null) => "high" | "low" | "skip",
      getValue: (record: (typeof descriptiveSubmissions)[number]) => number | null,
    ) => {
      let lowUse = 0;
      let lowTotal = 0;
      let highUse = 0;
      let highTotal = 0;

      submissionsWithUse.forEach((record) => {
        const value = getValue(record);
        const level = getLevel(value);
        if (level === "skip") return;
        const incrementUse = record.currentUse === true ? 1 : 0;
        if (level === "low") {
          lowTotal += 1;
          lowUse += incrementUse;
        } else {
          highTotal += 1;
          highUse += incrementUse;
        }
      });

      if (lowTotal === 0 && highTotal === 0) {
        return null;
      }

      return {
        category: label,
        low: lowTotal > 0 ? (lowUse / lowTotal) * 100 : null,
        high: highTotal > 0 ? (highUse / highTotal) * 100 : null,
      };
    };

    const results = [
      computeRate("Motivation", (value) => (value == null ? "skip" : value >= 4 ? "high" : "low"), (r) => r.motivation),
      computeRate("Ability", (value) => (value == null ? "skip" : value >= 4 ? "high" : "low"), (r) => r.ability),
      computeRate(
        "Descriptive norms",
        (value) => (value == null ? "skip" : value >= 4 ? "high" : "low"),
        (r) => r.descriptiveNorms,
      ),
      computeRate(
        "Injunctive norms",
        (value) => {
          if (value == null || value === 4) return "skip";
          return value === 1 ? "high" : "low";
        },
        (r) => r.injunctiveNorms,
      ),
      computeRate(
        "System readiness",
        (value) => (value == null ? "skip" : value >= 4 ? "high" : "low"),
        (r) => r.systemReadiness,
      ),
    ].filter((item): item is NonNullable<typeof item> => Boolean(item));

    return results;
  }, [descriptiveSubmissions]);

  const demographicDistributions = useMemo(() => {
    const age = buildCategoryCounts((record) => record.ageBucket);
    const state = buildCategoryCounts((record) => record.state?.label ?? null);
    const lga = buildCategoryCounts((record) => record.lga?.label ?? null);
    const gender = buildCategoryCounts((record) => record.gender?.label ?? null);
    const marital = buildCategoryCounts((record) => record.maritalStatus?.label ?? null);
    const education = buildCategoryCounts((record) => record.educationLevel?.label ?? null);
    const religion = buildCategoryCounts((record) => record.religion?.label ?? null);
    const employment = buildCategoryCounts((record) => record.employmentStatus?.label ?? null);
    const occupation = buildCategoryCounts((record) => record.occupation?.label ?? null);
    const location = buildCategoryCounts((record) => record.location?.label ?? null);
    const parity = buildCategoryCounts((record) => record.parityBucket);

    return { age, state, lga, gender, marital, education, religion, employment, occupation, location, parity };
  }, [buildCategoryCounts]);

  const practiceDistribution = useMemo(
    () =>
      buildCategoryCounts((record) => {
        if (record.currentUse == null) return "Unknown";
        return record.currentUse ? "Currently using" : "Not using";
      }),
    [buildCategoryCounts],
  );

  const fbmLikertDistributions = useMemo(() => {
    const motivation = buildLikertCounts(descriptiveSubmissions.map((record) => record.motivation));
    const ability = buildLikertCounts(descriptiveSubmissions.map((record) => record.ability));
    const descriptiveNorms = buildLikertCounts(descriptiveSubmissions.map((record) => record.descriptiveNorms));
    const injunctiveNorms = buildLikertCounts(descriptiveSubmissions.map((record) => record.injunctiveNorms));
    const system = buildLikertCounts(descriptiveSubmissions.map((record) => record.systemReadiness));

    return { motivation, ability, descriptiveNorms, injunctiveNorms, system };
  }, [buildLikertCounts, descriptiveSubmissions]);

  return (
    <div
      ref={reportRef}
      className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col print-page"
    >
      {!dataMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-6">
          <div className="w-full max-w-lg rounded-xl border bg-card/95 p-8 shadow-xl space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold">Choose your data source</h2>
              <p className="text-sm text-muted-foreground">
                Would you like to view the live analytics from the connected data source or upload your own dataset?
              </p>
            </div>
            <RadioGroup
              value={pendingMode ?? ""}
              onValueChange={(value) => setPendingMode(value as DataMode)}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="live" id={liveModeId} className="mt-1" />
                <div>
                  <Label htmlFor={liveModeId} className="text-base font-medium">
                    Use live data source
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically syncs the latest survey submissions and keeps your dashboard up to date.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="upload" id={uploadModeId} className="mt-1" />
                <div>
                  <Label htmlFor={uploadModeId} className="text-base font-medium">
                    Upload my dataset
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Provide a CSV export of your survey results to explore them within the dashboard experience.
                  </p>
                </div>
              </div>
            </RadioGroup>
            <Button className="w-full" onClick={handleConfirmMode} disabled={!pendingMode}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {dataMode === "upload" && (
        <>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          {!analytics ? (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/95 backdrop-blur-md p-6">
              <div className="w-full max-w-lg rounded-xl border bg-card/95 p-8 shadow-xl space-y-6 text-center">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">
                    {isProcessingUpload ? "Processing your dataset" : "Upload your dataset"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isProcessingUpload
                      ? "We are parsing your file and preparing the dashboard. This can take a few seconds for larger datasets."
                      : "Select a CSV export of your survey results to explore them in the dashboard."}
                  </p>
                </div>
                {uploadError ? (
                  <div className="space-y-4">
                    <p className="text-sm text-destructive font-medium">{uploadError}</p>
                    <Button className="w-full" onClick={handleUploadClick}>
                      Try again
                    </Button>
                  </div>
                ) : isProcessingUpload ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 bg-muted/50">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Please wait while we process your file…</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-8 bg-muted/50">
                    <p className="text-sm text-muted-foreground">Drag and drop your file here, or click below to browse.</p>
                    <Button className="mt-4" onClick={handleUploadClick}>
                      Choose file
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm print-container print:border-primary/30 print:bg-gradient-to-r print:from-primary/12 print:to-chart-3/10 print:shadow-none">
        <div className="container mx-auto px-6 py-5 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <img
                src="/images/inicio-logo.png"
                alt="Inicio logo"
                className="h-20 w-auto object-contain sm:h-24 print:h-16"
              />
              <div className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-foreground bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent sm:text-4xl print:text-transparent print:bg-gradient-to-r print:from-primary/80 print:to-chart-3/80">
                  Inicio BEHAV360
                </h1>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary/80 sm:text-base print:text-primary/70">
                  A 360° Diagnostic of Behavior Drivers and Barriers
                </p>
                <p className="text-sm text-muted-foreground font-medium sm:text-base print:text-slate-600">{syncStatus}</p>
                {isLiveMode ? (
                  <>
                    <p className="text-xs text-muted-foreground sm:text-sm print:text-slate-500">
                      Last data sync: {lastSyncLabel}
                    </p>
                    <p className="text-xs text-muted-foreground sm:text-sm print:text-slate-500">
                      Data refreshes automatically every minute.
                    </p>
                  </>
                ) : null}
              </div>
            </div>
            <div className="no-print flex items-center gap-3">
              {dataMode === "upload" && analytics ? (
                <Button variant="outline" onClick={handleUploadClick} disabled={isProcessingUpload}>
                  Replace file
                </Button>
              ) : null}
              <PDFExportButton targetRef={reportRef} disabled={isPdfDisabled} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10 max-w-7xl flex-1 print-container print:px-0 print:py-0">
        <div className="print:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 animate-fade-in print:space-y-0">
            <TabsList className="grid w-full max-w-6xl grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mx-auto h-auto p-1.5 bg-card/50 backdrop-blur-sm shadow-md gap-1">
              <TabsTrigger value="demographics" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Demographic Profile</span>
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Knowledge &amp; Practices</span>
              </TabsTrigger>
              <TabsTrigger value="fbmStatus" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">FBM Status</span>
              </TabsTrigger>
              <TabsTrigger value="variation" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
                <Compass className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Behavioral Variation</span>
              </TabsTrigger>
              <TabsTrigger value="ecosystem" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
                <MapIcon className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Ecosystem Map</span>
              </TabsTrigger>
              <TabsTrigger value="segmentation" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Disaggregation</span>
              </TabsTrigger>
              <TabsTrigger value="relationship" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
                <LineChart className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Relationship Model</span>
              </TabsTrigger>
              <TabsTrigger value="prompts" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
                <Flame className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Prompt Typology</span>
              </TabsTrigger>
              <TabsTrigger value="strategy" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Strategic Insights</span>
              </TabsTrigger>
              <TabsTrigger value="interpretation" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Interpretation</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="demographics" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
              <section className="space-y-6 print:space-y-8 print-section">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-2 text-primary shadow-sm">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Demographic Profile of Respondents</h2>
                    <p className="text-muted-foreground">Frequency distributions for A1–A13, including age, marital status, education, location, and parity.</p>
                  </div>
                </div>
                <DashboardOverview
                  stats={analytics?.stats}
                  quadrants={analytics?.quadrants}
                  isLoading={isAnalyticsLoading}
                  error={analyticsError}
                  onRetry={retryHandler}
                  metadata={overviewMetadata}
                  descriptive={analytics?.descriptive}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <RequirementCard
                    title="Demographic distributions"
                    description="Ensure coverage of key respondent attributes."
                    bullets={[
                      "Age, marital status, education, location, and parity frequencies",
                      "Include household composition and residence type where available",
                      "Highlight missing data to surface collection gaps",
                    ]}
                  />
                  <RequirementCard
                    title="Question coverage"
                    description="Align visualisations to the demographic block (A1–A13)."
                    bullets={[
                      "Map visual filters to A-series questions for drill-downs",
                      "Annotate charts with the question codes for transparency",
                      "Surface sample sizes per category to contextualise proportions",
                    ]}
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <CategoryDistributionChart
                    title="Age distribution"
                    subtitle="A5 · Completed years grouped by bucket"
                    data={demographicDistributions.age}
                    isLoading={isAnalyticsLoading}
                    emptyMessage="Age values not available in the current dataset."
                  />
                  <CategoryDistributionChart
                    title="State"
                    subtitle="A1 · State of residence"
                    data={demographicDistributions.state}
                    isLoading={isAnalyticsLoading}
                    emptyMessage="States are missing from the dataset."
                  />
                  <CategoryDistributionChart
                    title="LGA"
                    subtitle="A2 · Local Government Area"
                    data={demographicDistributions.lga}
                    isLoading={isAnalyticsLoading}
                    emptyMessage="LGAs are missing from the dataset."
                  />
                  <CategoryDistributionChart
                    title="Gender of respondent"
                    subtitle="A4 · Self-reported gender"
                    data={demographicDistributions.gender}
                    isLoading={isAnalyticsLoading}
                    emptyMessage="Gender values not available in the dataset."
                  />
                  <CategoryDistributionChart
                    title="Location"
                    subtitle="A3 · Urban vs rural residence"
                    data={demographicDistributions.location}
                    isLoading={isAnalyticsLoading}
                    emptyMessage="Location values are missing from the dataset."
                  />
                  <CategoryDistributionChart
                    title="Marital status"
                    subtitle="A6 · Current marital/cohabitation status"
                    data={demographicDistributions.marital}
                    isLoading={isAnalyticsLoading}
                  />
                  <CategoryDistributionChart
                    title="Education level"
                    subtitle="A7 · Highest level completed"
                    data={demographicDistributions.education}
                    isLoading={isAnalyticsLoading}
                  />
                  <CategoryDistributionChart
                    title="Religion"
                    subtitle="A8 · Faith affiliation"
                    data={demographicDistributions.religion}
                    isLoading={isAnalyticsLoading}
                    emptyMessage="No religion responses recorded yet."
                  />
                  <CategoryDistributionChart
                    title="Employment status"
                    subtitle="A9 · Current employment status"
                    data={demographicDistributions.employment}
                    isLoading={isAnalyticsLoading}
                    emptyMessage="Employment fields are missing from the dataset."
                  />
                  <CategoryDistributionChart
                    title="Occupation or income source"
                    subtitle="A10 · Primary occupation"
                    data={demographicDistributions.occupation}
                    isLoading={isAnalyticsLoading}
                    emptyMessage="Occupation values not available in the dataset."
                  />
                  <CategoryDistributionChart
                    title="Parity"
                    subtitle="Derived buckets of number of children"
                    data={demographicDistributions.parity}
                    isLoading={isAnalyticsLoading}
                    emptyMessage="Parity fields (A-series) were not detected in the dataset."
                  />
                </div>
              </section>
            </TabsContent>

            <TabsContent value="knowledge" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
              <section className="space-y-6 print:space-y-8 print-section">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-chart-2/10 p-2 text-chart-2 shadow-sm">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Knowledge &amp; Practices Related to Contraception</h2>
                    <p className="text-muted-foreground">Summaries for B1–B3 to show awareness and practice patterns.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <RequirementCard
                    title="Knowledge and practices"
                    bullets={[
                      "Frequency of knowledge of contraception methods",
                      "Practices and current use broken down by method type",
                      "Flagged gaps where awareness does not translate to practice",
                    ]}
                  />
                  <RequirementCard
                    title="Question linkage"
                    bullets={[
                      "Explicitly reference B1–B3 in chart subtitles",
                      "Allow toggling between knowledge-only and practice views",
                      "Provide tooltips clarifying how 'practice' is defined in the data",
                    ]}
                  />
                </div>
                <CategoryDistributionChart
                  title="Current use of contraception"
                  subtitle="B2 · Practice distribution"
                  data={practiceDistribution}
                  isLoading={isAnalyticsLoading}
                  emptyMessage="No B2 responses found to calculate practice levels."
                />
              </section>
            </TabsContent>

            <TabsContent value="fbmStatus" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
              <section className="space-y-6 print:space-y-8 print-section">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-chart-3/10 p-2 text-chart-3 shadow-sm">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Status of FBM Components, Social Norms &amp; System Enablers</h2>
                    <p className="text-muted-foreground">Distribution summaries for Motivation (C2–C4), Ability (D1–D4), Prompts (E1–E2), Norms (F1–F2), and System Enablers (G1–G3).</p>
                  </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <FBMQuadrantDistribution
                    quadrants={analytics?.quadrants}
                    isLoading={isAnalyticsLoading}
                    error={analyticsError}
                  />
                  <FBMSegmentHighlights quadrants={analytics?.quadrants} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <RequirementCard
                    title="Motivation &amp; Ability thresholds"
                    bullets={[
                      "Motivation levels: 1–3 = Low, 4–5 = High",
                      "Ability levels: 1–3 = Low, 4–5 = High",
                      "Include frequency and summary distributions with mean, median, and SD",
                    ]}
                  />
                  <RequirementCard
                    title="Norms, prompts, and system enablers"
                    bullets={[
                      "Prompts/Triggers (E1–E2) frequency distribution",
                      "Descriptive norms: 1–3 = Low, 4–5 = High; Injunctive norms: 1 = High, 2–3 = Low, 4 = Missing/Uncertain",
                      "System readiness score and category (1–3 = Low, 4–5 = High)",
                    ]}
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <LikertDistributionChart
                    title="Motivation distribution"
                    subtitle="C2–C4 · Low (1–3) vs High (4–5)"
                    data={fbmLikertDistributions.motivation}
                    isLoading={isAnalyticsLoading}
                  />
                  <LikertDistributionChart
                    title="Ability distribution"
                    subtitle="D1–D4 · Low (1–3) vs High (4–5)"
                    data={fbmLikertDistributions.ability}
                    isLoading={isAnalyticsLoading}
                  />
                  <LikertDistributionChart
                    title="Descriptive norms"
                    subtitle="F1 · Community prevalence (1–3 Low, 4–5 High)"
                    data={fbmLikertDistributions.descriptiveNorms}
                    isLoading={isAnalyticsLoading}
                  />
                  <LikertDistributionChart
                    title="Injunctive norms"
                    subtitle="F2 · Approval (1 High, 2–3 Low, 4 Missing/Uncertain)"
                    data={fbmLikertDistributions.injunctiveNorms}
                    isLoading={isAnalyticsLoading}
                  />
                  <LikertDistributionChart
                    title="System readiness"
                    subtitle="G1–G3 · Reliability, respect, and access (1–3 Low, 4–5 High)"
                    data={fbmLikertDistributions.system}
                    isLoading={isAnalyticsLoading}
                  />
                </div>
              </section>
            </TabsContent>

            <TabsContent value="variation" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
              <section className="space-y-6 print:space-y-8 print-section">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-chart-4/10 p-2 text-chart-4 shadow-sm">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">How Behavior Varies by Motivation, Ability, Norms &amp; System</h2>
                    <p className="text-muted-foreground">Cross-tabulations of contraceptive use across FBM levels, social norms, and system readiness.</p>
                  </div>
                </div>
                <RequirementCard
                  title="Cross-tabs and chi-square tests"
                  bullets={[
                    "Behavior (use) × Motivation levels",
                    "Behavior × Ability levels",
                    "Behavior × Descriptive norms and Injunctive norms",
                    "Behavior × System readiness",
                    "Run chi-square tests for each categorical comparison to flag significance",
                  ]}
                />
                <CrossTabUseChart
                  title="Contraceptive use by FBM, norms, and system level"
                  subtitle="Behaviour × levels (Low vs High)"
                  data={behaviorVariationData}
                  isLoading={isAnalyticsLoading}
                />
              </section>
            </TabsContent>

            <TabsContent value="ecosystem" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
              <section className="space-y-6 print:space-y-8 print-section">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-chart-5/10 p-2 text-chart-5 shadow-sm">
                    <MapIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Behavioral Ecosystem Map (FBM + System Factors)</h2>
                    <p className="text-muted-foreground">Bivariate FBM plot with norms and system overlays to spotlight hot and cold spots.</p>
                  </div>
                </div>
                <FBMQuadrantChart
                  points={analytics?.scatter}
                  isLoading={isAnalyticsLoading}
                  error={analyticsError}
                />
                <RequirementCard
                  title="Overlay rules"
                  bullets={[
                    "Quadrants: High M/High A, High M/Low A, Low M/High A, Low M/Low A",
                    "Colour code by contraceptive use, bubble size/shape for social norm strength",
                    "Descriptive norm: small bubble = Low, large bubble = High; Injunctive norm: shape changes from Low to High",
                    "Add gradient/layer for system readiness and call out hot vs cold spots",
                  ]}
                />
              </section>
            </TabsContent>

            <TabsContent value="segmentation" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
              <section className="space-y-6 print:space-y-8 print-section">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-2 text-primary shadow-sm">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Disaggregation &amp; Behavioral Segmentation</h2>
                    <p className="text-muted-foreground">Repeat FBM, norms, and system mapping by subgroup and identify emergent segments.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <RequirementCard
                    title="Disaggregation filters"
                    bullets={[
                      "Age group, marital status, urban/rural, education, parity",
                      "Allow side-by-side comparison of subgroup FBM and norms distributions",
                      "Highlight statistically meaningful gaps between subgroups",
                    ]}
                  />
                  <RequirementCard
                    title="Segmentation blueprint"
                    bullets={[
                      "Run k-means or hierarchical clustering on motivation, ability, norms, prompts, and system variables",
                      "Label segments (e.g., Motivated but constrained; Low motivation despite ease; High ability but low norms)",
                      "Provide radar or profile cards to describe segment attributes",
                    ]}
                  />
                </div>
                <SegmentProfiles
                  segments={analytics?.segments}
                  isLoading={isAnalyticsLoading}
                  error={analyticsError}
                />
              </section>
            </TabsContent>

            <TabsContent value="relationship" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
              <section className="space-y-6 print:space-y-8 print-section">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-chart-2/10 p-2 text-chart-2 shadow-sm">
                    <LineChart className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Predictors of Contraceptive Use (Logistic Regression)</h2>
                    <p className="text-muted-foreground">Dependent variable: current use (Yes/No) with FBM, norms, prompts, system, and demographic covariates.</p>
                  </div>
                </div>
                <PathDiagram
                  regression={analytics?.regression}
                  summary={analytics?.modelSummary}
                  isLoading={isAnalyticsLoading}
                  error={analyticsError}
                />
                <RequirementCard
                  title="Model outputs"
                  bullets={[
                    "Adjusted Odds Ratios (AORs) and p-values for Motivation, Ability, norms, prompts, system score, and demographics",
                    "Interaction terms: Motivation × Ability, Norms × Motivation, System × Ability",
                    "Model fit diagnostics: LR test, ROC, pseudo R²",
                  ]}
                />
              </section>
            </TabsContent>

            <TabsContent value="prompts" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
              <section className="space-y-6 print:space-y-8 print-section">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-chart-3/10 p-2 text-chart-3 shadow-sm">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Prompt Exposure Patterns &amp; Effectiveness</h2>
                    <p className="text-muted-foreground">Track Spark, Signal, and Facilitator prompts and their association with use.</p>
                  </div>
                </div>
                <PromptEffectivenessHeatmap
                  rows={analytics?.promptEffectiveness}
                  isLoading={isAnalyticsLoading}
                  error={analyticsError}
                />
                <RequirementCard
                  title="Prompt typology"
                  bullets={[
                    "Frequency of Spark, Signal, and Facilitator exposure",
                    "Association between prompt type and contraceptive use",
                    "Moderation by FBM quadrants and system readiness score",
                  ]}
                />
              </section>
            </TabsContent>

            <TabsContent value="strategy" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
              <section className="space-y-6 print:space-y-8 print-section">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-chart-4/10 p-2 text-chart-4 shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Strategic Insights Based on FBM, Norms &amp; System</h2>
                    <p className="text-muted-foreground">Action recommendations tailored to quadrant positioning, norm influence, and system readiness.</p>
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <RequirementCard
                    title="FBM quadrant recommendations"
                    bullets={[
                      "Low M / High A → Motivation-building",
                      "High M / Low A → Ability interventions",
                      "Low M / Low A → Integrated + strong prompts",
                    ]}
                  />
                  <RequirementCard
                    title="Norms, system, and prompt strategy"
                    bullets={[
                      "Identify whether descriptive or injunctive norms matter more for the behaviour",
                      "System recommendations: reliability, provider respect, access improvements",
                      "Prompt strategy: Sparks for low motivation, Facilitators for low ability, Signals for high M + high A",
                    ]}
                  />
                </div>
              </section>
            </TabsContent>

            <TabsContent value="interpretation" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
              <section className="space-y-6 print:space-y-8 print-section">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-chart-5/10 p-2 text-chart-5 shadow-sm">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Interpretation of Visualisations</h2>
                    <p className="text-muted-foreground">Guidance on reading the FBM scatter, radar profiles, prompt heatmaps, and recommended actions.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <RequirementCard
                    title="How to read the visuals"
                    bullets={[
                      "FBM scatter plot: locate hot vs cold spots and overlay cues for norms and system readiness",
                      "Segment radar profiles: compare peaks/valleys to tailor interventions",
                      "Prompt heatmap: link strongest prompt types to specific quadrants",
                    ]}
                  />
                  <RequirementCard
                    title="Key findings & recommendations"
                    bullets={[
                      "Synthesize notable deviations from expected FBM patterns",
                      "Call out surprising norm or system effects that reshape prioritisation",
                      "Translate visuals into next-step recommendations for programmes",
                    ]}
                  />
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </div>
        <ExecutivePrintReport
          analytics={analytics}
          metadata={overviewMetadata}
          isLoading={isAnalyticsLoading}
          error={analyticsError}
          dataMode={dataMode}
          syncStatus={syncStatus}
        />
      </main>
      <footer className="border-t bg-card/80 backdrop-blur-xl print-container print:border-primary/20 print:bg-gradient-to-r print:from-primary/10 print:to-transparent">
        <div className="container mx-auto px-6 py-4 max-w-7xl text-center">
          <p className="text-base font-semibold text-muted-foreground print:text-slate-600">
            Powered by Inicio Tech Team &copy; 2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
