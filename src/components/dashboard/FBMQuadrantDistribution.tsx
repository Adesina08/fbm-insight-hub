import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";

import type { QuadrantInsight } from "@/lib/googleSheets";
import { formatAverage, formatNumber, formatPercentage } from "@/lib/dashboardFormatters";

interface FBMQuadrantDistributionProps {
  quadrants?: QuadrantInsight[];
  isLoading?: boolean;
  error?: string | null;
}

const LoadingState = () => (
  <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
    <CardHeader className="pb-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </CardContent>
  </Card>
);

const ErrorState = ({ message }: { message: string }) => (
  <Card className="border-0 shadow-xl bg-destructive/10 border-destructive/30">
    <CardHeader>
      <CardTitle className="text-destructive">Unable to load FBM quadrant distribution</CardTitle>
      <CardDescription className="text-destructive/80">{message}</CardDescription>
    </CardHeader>
  </Card>
);

const FBMQuadrantDistribution = ({
  quadrants,
  isLoading = false,
  error,
}: FBMQuadrantDistributionProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!quadrants) {
    return (
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">FBM Quadrant Distribution</CardTitle>
              <CardDescription className="text-base mt-1">
                Respondent distribution across Fogg Behavior Model quadrants
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We need both motivation and ability scores to calculate the quadrant distribution. Connect a dataset to see these
            insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasQuadrantData = quadrants.some((quadrant) => quadrant.count > 0);

  return (
    <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-6">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">FBM Quadrant Distribution</CardTitle>
            <CardDescription className="text-base mt-1">
              Respondent distribution across Fogg Behavior Model quadrants
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasQuadrantData ? (
          <div className="space-y-5">
            {quadrants.map((insight) => (
              <div
                key={insight.id}
                className={`group p-5 rounded-xl border-2 transition-all hover:shadow-lg hover:scale-[1.02] duration-300 ${insight.color}`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-lg text-foreground">{insight.label}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
                      <div>
                        <span className="font-semibold text-foreground block">Average Motivation</span>
                        <span>{formatAverage(insight.avgMotivation)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block">Average Ability</span>
                        <span>{formatAverage(insight.avgAbility)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block">Current Use Rate</span>
                        <span>
                          {insight.currentUseRate == null
                            ? "n/a"
                            : formatPercentage(insight.currentUseRate * 100)}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block">Responses</span>
                        <span>{formatNumber(insight.count)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right md:ml-6">
                    <div className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {formatPercentage(insight.percentage)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 font-medium">
                      {formatNumber(insight.count)} respondents
                    </div>
                  </div>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-3 mt-4 overflow-hidden shadow-inner">
                  <div
                    className={`h-3 rounded-full ${insight.barColor} transition-all duration-500 shadow-sm`}
                    style={{ width: `${insight.percentage.toFixed(0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Google Sheet rows do not yet contain motivation and ability scores. Once they are provided, the quadrant analysis will
            populate automatically.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FBMQuadrantDistribution;
