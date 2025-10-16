import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, BarChart3, Users, Target, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import FBMQuadrantChart from "@/components/dashboard/FBMQuadrantChart";
import SegmentProfiles from "@/components/dashboard/SegmentProfiles";
import UploadSection from "@/components/dashboard/UploadSection";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Behaviour360</h1>
                <p className="text-sm text-muted-foreground">Survey Analytics Dashboard</p>
              </div>
            </div>
            <Button variant="default" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Data
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mx-auto">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="fbm" className="gap-2">
              <Target className="w-4 h-4" />
              FBM Analysis
            </TabsTrigger>
            <TabsTrigger value="segments" className="gap-2">
              <Users className="w-4 h-4" />
              Segments
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="fbm" className="space-y-6">
            <FBMQuadrantChart />
          </TabsContent>

          <TabsContent value="segments" className="space-y-6">
            <SegmentProfiles />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <UploadSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
