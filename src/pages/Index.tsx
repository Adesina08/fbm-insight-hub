import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, Target, Zap, Network, Loader2 } from "lucide-react";
import DashboardOverview, { type DashboardOverviewMetadata } from "@/components/dashboard/DashboardOverview";
import FBMQuadrantChart from "@/components/dashboard/FBMQuadrantChart";
import SegmentProfiles from "@/components/dashboard/SegmentProfiles";
import PromptEffectivenessHeatmap from "@/components/dashboard/PromptEffectivenessHeatmap";
import PathDiagram from "@/components/dashboard/PathDiagram";
import PDFExportButton from "@/components/dashboard/PDFExportButton";
import ExecutivePrintReport from "@/components/dashboard/ExecutivePrintReport";
import { useSheetsAnalytics } from "@/hooks/useSheetsAnalytics";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseUploadedDataset } from "@/lib/uploadAnalytics";
import type { DashboardAnalytics } from "@/lib/googleSheets";

type DataMode = "live" | "upload";

const Index = () => {

  const [activeTab, setActiveTab] = useState("overview");
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
  const syncStatus = useMemo(() => {
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
    if (isError) return error?.message ?? "Sync error";
    return "Live data from connected source";
  }, [
    dataMode,
    error?.message,
    isError,
    isFetching,
    isLoading,
    isProcessingUpload,
    uploadError,
    uploadedAnalytics,
    uploadedFile,
    uploadSummary?.rowCount,
  ]);

  const analytics = useMemo(() => {
    if (isLiveMode) {
      return data ?? null;
    }
    return uploadedAnalytics;
  }, [data, isLiveMode, uploadedAnalytics]);

  const overviewMetadata = useMemo<DashboardOverviewMetadata | null | undefined>(() => {
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
  }, [
    dataMode,
    isProcessingUpload,
    uploadSummary?.rowCount,
    uploadedAnalytics,
    uploadedFile,
  ]);

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

  const isPdfDisabled = useMemo(() => {
    if (!analytics) {
      return true;
    }
    if (isLiveMode) {
      return isLoading || isFetching;
    }
    return isProcessingUpload;
  }, [analytics, isFetching, isLiveMode, isLoading, isProcessingUpload]);

  const isAnalyticsLoading = isLiveMode ? (isLoading || isFetching) : isProcessingUpload;
  const analyticsError = isLiveMode && isError ? error?.message ?? "Unable to load analytics data." : null;
  const retryHandler = isLiveMode ? refetch : undefined;

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
                <RadioGroupItem value="live" id="mode-live" className="mt-1" />
                <div>
                  <Label htmlFor="mode-live" className="text-base font-medium">
                    Use live data source
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically syncs the latest survey submissions and keeps your dashboard up to date.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="upload" id="mode-upload" className="mt-1" />
                <div>
                  <Label htmlFor="mode-upload" className="text-base font-medium">
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
            <div className="flex items-center gap-4">
              <img
                src="/images/inicio-logo.png"
                alt="Inicio logo"
                className="h-16 w-auto object-contain print:h-14"
              />
              <div className="space-y-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent print:text-transparent print:bg-gradient-to-r print:from-primary/80 print:to-chart-3/80">
                  Behavioural Survey Solution
                </h1>
                <p className="text-sm text-muted-foreground font-medium print:text-slate-600"> </p>
                <p className="text-xs text-muted-foreground mt-1 print:text-slate-500">{syncStatus}</p>
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
          <TabsList className="grid w-full max-w-6xl grid-cols-5 mx-auto h-auto p-1.5 bg-card/50 backdrop-blur-sm shadow-md">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="fbm" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">FBM</span>
            </TabsTrigger>
            <TabsTrigger value="segments" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Segments</span>
            </TabsTrigger>
            <TabsTrigger value="prompts" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Prompts</span>
            </TabsTrigger>
            <TabsTrigger value="regression" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
              <Network className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Model</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
            <section className="space-y-6 print:space-y-8 print-section">
              <div className="hidden print:flex print-section-header">
                <div className="print-section-icon">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2>Executive Overview</h2>
                  <p>Key behavioural adoption metrics and respondent distribution at a glance.</p>
                </div>
                <span className="print-section-badge">Overview</span>
              </div>
              <DashboardOverview
                stats={analytics?.stats}
                quadrants={analytics?.quadrants}
                lastUpdated={analytics?.lastUpdated}
                isLoading={isAnalyticsLoading}
                error={analyticsError}
                onRetry={retryHandler}
                metadata={overviewMetadata}
              />
            </section>
          </TabsContent>

          <TabsContent value="fbm" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
            <section className="space-y-6 print:space-y-8 print-section">
              <div className="hidden print:flex print-section-header">
                <div className="print-section-icon">
                  <Target className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2>FBM Quadrant Insights</h2>
                  <p>Visualising ability versus motivation with behaviour outcomes for each respondent.</p>
                </div>
                <span className="print-section-badge">FBM</span>
              </div>
              <FBMQuadrantChart
                points={analytics?.scatter}
                isLoading={isAnalyticsLoading}
                error={analyticsError}
              />
            </section>
          </TabsContent>

          <TabsContent value="segments" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
            <section className="space-y-6 print:space-y-8 print-section">
              <div className="hidden print:flex print-section-header">
                <div className="print-section-icon">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2>Segment Profiles</h2>
                  <p>Personas, strengths, and barriers that guide tailored engagement approaches.</p>
                </div>
                <span className="print-section-badge">Segments</span>
              </div>
              <SegmentProfiles
                segments={analytics?.segments}
                isLoading={isAnalyticsLoading}
                error={analyticsError}
              />
            </section>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
            <section className="space-y-6 print:space-y-8 print-section">
              <div className="hidden print:flex print-section-header">
                <div className="print-section-icon">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2>Prompt Effectiveness</h2>
                  <p>Performance of behavioural nudges mapped against motivation, ability, and outcomes.</p>
                </div>
                <span className="print-section-badge">Prompts</span>
              </div>
              <PromptEffectivenessHeatmap
                rows={analytics?.promptEffectiveness}
                isLoading={isAnalyticsLoading}
                error={analyticsError}
              />
            </section>
          </TabsContent>

          <TabsContent value="regression" className="space-y-6 mt-8 print:space-y-0 print:mt-0" forceMount>
            <section className="space-y-6 print:space-y-8 print-section">
              <div className="hidden print:flex print-section-header">
                <div className="print-section-icon">
                  <Network className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2>Model Pathways</h2>
                  <p>System drivers and behavioural pathways powering contraceptive adoption.</p>
                </div>
                <span className="print-section-badge">Model</span>
              </div>
              <PathDiagram
                regression={analytics?.regression}
                summary={analytics?.modelSummary}
                isLoading={isAnalyticsLoading}
                error={analyticsError}
              />
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
