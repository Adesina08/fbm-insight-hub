import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, BarChart3, Users, Target, Activity, FileText, Zap, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import FBMQuadrantChart from "@/components/dashboard/FBMQuadrantChart";
import SegmentProfiles from "@/components/dashboard/SegmentProfiles";
import UploadSection from "@/components/dashboard/UploadSection";
import QuestionnaireReference from "@/components/dashboard/QuestionnaireReference";
import PromptEffectivenessHeatmap from "@/components/dashboard/PromptEffectivenessHeatmap";
import PathDiagram from "@/components/dashboard/PathDiagram";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-5 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-chart-3 to-secondary flex items-center justify-center shadow-lg">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
                  BEHAV360
                </h1>
                <p className="text-sm text-muted-foreground font-medium">Survey Analytics Dashboard</p>
              </div>
            </div>
            <Button className="gap-2 bg-gradient-to-r from-primary to-chart-3 hover:opacity-90 shadow-md">
              <Upload className="w-4 h-4" />
              Upload Data
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 animate-fade-in">
          <TabsList className="grid w-full max-w-6xl grid-cols-7 mx-auto h-auto p-1.5 bg-card/50 backdrop-blur-sm shadow-md">
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
            <TabsTrigger value="questionnaire" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Reference</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-3 data-[state=active]:text-white data-[state=active]:shadow-md py-3">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Upload</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-8">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="fbm" className="space-y-6 mt-8">
            <FBMQuadrantChart />
          </TabsContent>

          <TabsContent value="segments" className="space-y-6 mt-8">
            <SegmentProfiles />
          </TabsContent>

          <TabsContent value="prompts" className="space-y-6 mt-8">
            <PromptEffectivenessHeatmap />
          </TabsContent>

          <TabsContent value="regression" className="space-y-6 mt-8">
            <PathDiagram />
          </TabsContent>

          <TabsContent value="questionnaire" className="space-y-6 mt-8">
            <QuestionnaireReference />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6 mt-8">
            <UploadSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;