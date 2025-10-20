import Plot from "react-plotly.js";
import { Users, Lightbulb, ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { SegmentSummary } from "@/lib/sheets";

interface SegmentProfilesProps {
  segments?: SegmentSummary[];
  isLoading?: boolean;
  error?: string | null;
}

const formatMetric = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return "n/a";
  return value.toFixed(2);
};

const formatPercentage = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return "n/a";
  return `${value.toFixed(1)}%`;
};

const LoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-56" />
    <Skeleton className="h-[480px] w-full" />
  </div>
);

const EmptyState = () => (
  <div className="p-6 text-sm text-muted-foreground bg-muted/20 rounded-lg">
    Segments will appear once Google Sheets submissions include both motivation and ability scores.
  </div>
);

const SegmentProfiles = ({ segments, isLoading = false, error }: SegmentProfilesProps) => {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-xl bg-destructive/10 border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Unable to load segment profiles</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!segments || segments.every((segment) => segment.count === 0)) {
    return (
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Behavioral Segments</CardTitle>
              <CardDescription className="text-base mt-1">
                Distinct groups based on clustering analysis of FBM components, norms, and system factors
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  const orderedSegments = [...segments].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Behavioral Segments</CardTitle>
              <CardDescription className="text-base mt-1">
                Distinct groups based on clustering analysis of FBM components, norms, and system factors
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={orderedSegments[0]?.id ?? ""} className="w-full">
            <TabsList className="grid w-full grid-cols-1 gap-2 p-1.5 bg-muted/50 md:grid-cols-4">
              {orderedSegments.map((segment) => (
                <TabsTrigger
                  key={segment.id}
                  value={segment.id}
                  className="text-sm py-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md font-medium"
                >
                  {segment.name.split(" ")[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            {orderedSegments.map((segment) => {
              const dimensions = Object.keys(segment.characteristics);
              const values = Object.values(segment.characteristics).map((value) => value ?? 0);

              return (
                <TabsContent key={segment.id} value={segment.id} className="space-y-6 mt-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <h3 className="text-3xl font-bold flex items-center gap-3 mb-2">
                        {segment.name}
                        <Badge className={`bg-${segment.color} text-white text-base px-3 py-1`}>
                          {formatPercentage(segment.percentage)}
                        </Badge>
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium">
                        {segment.count} respondents · Current use rate {formatPercentage(segment.currentUseRate == null ? null : segment.currentUseRate * 100)}
                      </p>
                      <p className="text-base text-foreground max-w-3xl leading-relaxed">
                        {segment.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    <div>
                      <Plot
                        data={[{
                          type: "scatterpolar",
                          r: values,
                          theta: dimensions.map((dimension) =>
                            dimension
                              .replace(/([A-Z])/g, " $1")
                              .trim()
                              .split(" ")
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")
                          ),
                          fill: "toself",
                          fillcolor: `var(--${segment.color})`,
                          opacity: 0.3,
                          line: {
                            color: `var(--${segment.color})`,
                            width: 3,
                          },
                          marker: {
                            size: 8,
                            color: `var(--${segment.color})`,
                          },
                        }]}
                        layout={{
                          polar: {
                            radialaxis: { visible: true, range: [0, 5], tickfont: { family: "inherit" } },
                            angularaxis: { tickfont: { family: "inherit" } },
                          },
                          autosize: true,
                          margin: { t: 20, b: 20, l: 20, r: 20 },
                          paper_bgcolor: "rgba(0,0,0,0)",
                          plot_bgcolor: "rgba(0,0,0,0)",
                          font: { family: "inherit" },
                        }}
                        config={{ displayModeBar: false }}
                      />
                    </div>

                    <div className="space-y-5">
                      <Card className="bg-muted/40 border-muted/40">
                        <CardHeader className="pb-3 flex flex-row items-center gap-3">
                          <Lightbulb className="w-5 h-5 text-primary" />
                          <CardTitle className="text-base">Segment Insights</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                          {segment.insights.map((insight, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                              <span>{insight}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/40 border-muted/40">
                        <CardHeader className="pb-3 flex flex-row items-center gap-3">
                          <ArrowRight className="w-5 h-5 text-primary" />
                          <CardTitle className="text-base">Priority Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                          {segment.recommendations.map((recommendation, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                              <span>{recommendation}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {dimensions.map((dimension) => (
                      <Card key={dimension} className="bg-muted/40 border-muted/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs text-muted-foreground">
                            {dimension.replace(/([A-Z])/g, " $1").trim()}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-foreground">
                            {formatMetric(segment.characteristics[dimension])}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">1-5 scale</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SegmentProfiles;
