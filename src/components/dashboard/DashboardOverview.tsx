import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import { Users, TrendingUp, Activity, Target, RefreshCcw } from "lucide-react";
import type { DashboardAnalytics, QuadrantInsight } from "@/lib/googleSheets";

interface DashboardOverviewProps {
  stats?: DashboardAnalytics["stats"];
  quadrants?: QuadrantInsight[];
  lastUpdated?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const formatNumber = (value: number | null | undefined, options: Intl.NumberFormatOptions = {}) => {
  if (value == null || Number.isNaN(value)) return "n/a";
  return new Intl.NumberFormat(undefined, options).format(value);
};

const formatAverage = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return "n/a";
  return `${value.toFixed(2)} / 5.0`;
};

const formatPercentage = (value: number) => `${value.toFixed(0)}%`;

const lastUpdatedLabel = (timestamp?: string) => {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
};

const LoadingState = () => (
  <div className="space-y-8 animate-fade-in">
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="border-0 bg-card/40">
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card className="border-0 bg-card/40">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
    <AlertTitle>Unable to load dashboard data</AlertTitle>
    <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" />
          Retry
        </Button>
      ) : null}
    </AlertDescription>
  </Alert>
);

const DashboardOverview = ({ stats, quadrants, lastUpdated, isLoading = false, error, onRetry }: DashboardOverviewProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!stats || !quadrants) {
    return <ErrorState message="No submissions are available yet." onRetry={onRetry} />;
  }

  const cards: Array<{
    title: string;
    value: string;
    trendIcon: LucideIcon;
    suffix: string;
    gradient: string;
  }> = [
    {
      title: "Total Respondents",
      value: formatNumber(stats.totalRespondents.value),
      trendIcon: Users,
      suffix: "",
      gradient: "from-chart-1 to-chart-1/60",
    },
    {
      title: "Contraceptive Users",
      value: formatNumber(stats.currentUsers.value),
      trendIcon: Target,
      suffix: "",
      gradient: "from-chart-2 to-chart-2/60",
    },
    {
      title: "Avg Motivation Score",
      value:
        stats.averageMotivation.value == null || Number.isNaN(stats.averageMotivation.value)
          ? "n/a"
          : stats.averageMotivation.value.toFixed(2),
      trendIcon: TrendingUp,
      suffix: " / 5",
      gradient: "from-quadrant-high-m-high-a to-quadrant-high-m-high-a/60",
    },
    {
      title: "Avg Ability Score",
      value:
        stats.averageAbility.value == null || Number.isNaN(stats.averageAbility.value)
          ? "n/a"
          : stats.averageAbility.value.toFixed(2),
      trendIcon: Activity,
      suffix: " / 5",
      gradient: "from-chart-4 to-chart-4/60",
    },
  ];

  const hasQuadrantData = quadrants.some((quadrant) => quadrant.count > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Last data sync: <span className="font-medium text-foreground">{lastUpdatedLabel(lastUpdated)}</span>
          </p>
          <p className="text-xs text-muted-foreground">Data refreshes automatically every minute.</p>
        </div>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry} className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh now
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.trendIcon;
          return (
            <Card key={card.title} className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {card.value}
                  {card.suffix && card.value !== "n/a" ? (
                    <span className="text-base font-medium text-muted-foreground">{card.suffix}</span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
                      <h4 className="font-bold text-lg text-foreground">
                        {insight.label}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
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
                          <span>{insight.currentUseRate == null ? "n/a" : formatPercentage(insight.currentUseRate * 100)}</span>
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
              Google Sheet rows do not yet contain motivation and ability scores. Once they are provided, the quadrant analysis
              will populate automatically.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {(() => {
          const opportunityQuadrant = quadrants
            .filter((quadrant) => (quadrant.avgAbility ?? 0) < 3)
            .sort((a, b) => b.count - a.count)[0] ?? quadrants[0];
          const momentumQuadrant = quadrants
            .filter((quadrant) => (quadrant.avgMotivation ?? 0) >= 3 && (quadrant.avgAbility ?? 0) >= 3)
            .sort((a, b) => (b.currentUseRate ?? 0) - (a.currentUseRate ?? 0))[0] ?? quadrants[0];

          return (
            <>
              <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-chart-2 to-chart-2/70 shadow-md">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Opportunity Segment</CardTitle>
                      <CardDescription>Largest group with ability barriers</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">{opportunityQuadrant.label}</span> accounts for
                    {" "}{formatNumber(opportunityQuadrant.count)} respondents
                    ({formatPercentage(opportunityQuadrant.percentage)}). Average ability is
                    {" "}{formatAverage(opportunityQuadrant.avgAbility)} with a current use rate of
                    {" "}{opportunityQuadrant.currentUseRate == null
                      ? "n/a"
                      : formatPercentage(opportunityQuadrant.currentUseRate * 100)}.
                  </p>
                  <p>
                    Focus on facilitator prompts and system improvements to unlock this group. Remove logistical barriers while
                    maintaining the motivation already present.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-quadrant-high-m-high-a to-quadrant-high-m-high-a/70 shadow-md">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Momentum Segment</CardTitle>
                      <CardDescription>Where prompts can reinforce success</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">{momentumQuadrant.label}</span> shows the highest current use
                    rate at {momentumQuadrant.currentUseRate == null ? "n/a" : formatPercentage(momentumQuadrant.currentUseRate * 100)}
                    with motivation averaging {formatAverage(momentumQuadrant.avgMotivation)}. Maintain behaviour with light-touch signal prompts and peer-led storytelling.
                  </p>
                  <p>
                    Monitor this cohort as an early indicator of system performance—declines often appear here first when
                    service quality dips.
                  </p>
                </CardContent>
              </Card>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default DashboardOverview;
