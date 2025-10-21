import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, Target, Zap, Network } from "lucide-react";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import FBMQuadrantChart from "@/components/dashboard/FBMQuadrantChart";
import SegmentProfiles from "@/components/dashboard/SegmentProfiles";
import PromptEffectivenessHeatmap from "@/components/dashboard/PromptEffectivenessHeatmap";
import PathDiagram from "@/components/dashboard/PathDiagram";
import { useSheetsAnalytics } from "@/hooks/useSheetsAnalytics";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { data, isLoading, isError, error, refetch, isFetching } = useSheetsAnalytics();
  const syncStatus = useMemo(() => {
    if (isLoading) return "Connecting to data source…";
    if (isFetching) return "Syncing latest submissions…";
    if (isError) return error?.message ?? "Sync error";
    return "Live data from connected source";
  }, [error?.message, isError, isFetching, isLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-5 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/images/inicio-logo.png"
                alt="Inicio logo"
                className="h-16 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
                  Behavioural Survey Dashboard
                </h1>
                <p className="text-sm text-muted-foreground font-medium"> </p>
                <p className="text-xs text-muted-foreground mt-1">{syncStatus}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10 max-w-7xl flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 animate-fade-in">
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

          <TabsContent value="overview" className="space-y-6 mt-8">
            <DashboardOverview
              stats={data?.stats}
              quadrants={data?.quadrants}
              lastUpdated={data?.lastUpdated}
              isLoading={isLoading}
              error={isError ? error?.message ?? "" : null}
              onRetry={refetch}
            />
          </TabsContent>

          <TabsContent value="fbm" className="space-y-6 mt-8">
            <FBMQuadrantChart
              points={data?.scatter}
              isLoading={isLoading}
              error={isError ? error?.message ?? "" : null}
            />
          </TabsContent>

          <TabsContent value="segments" className="space-y-6 mt-8">
            <SegmentProfiles
              segments={data?.segments}
              isLoading={isLoading}
              error={isError ? error?.message ?? "" : null}
            />
          </TabsContent>

          <TabsContent value="prompts" className="space-y-6 mt-8">
            <PromptEffectivenessHeatmap
              rows={data?.promptEffectiveness}
              isLoading={isLoading}
              error={isError ? error?.message ?? "" : null}
            />
          </TabsContent>

          <TabsContent value="regression" className="space-y-6 mt-8">
            <PathDiagram
              regression={data?.regression}
              summary={data?.modelSummary}
              isLoading={isLoading}
              error={isError ? error?.message ?? "" : null}
            />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="border-t bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 max-w-7xl text-center">
          <p className="text-base font-semibold text-muted-foreground">Powered by Inicio Tech Team &copy; 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
