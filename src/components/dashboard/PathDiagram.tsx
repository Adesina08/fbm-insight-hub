import { Info } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ModelSummary, RegressionInsight } from "@/lib/googleSheets";

interface PathDiagramProps {
  regression?: RegressionInsight[];
  summary?: ModelSummary[];
  isLoading?: boolean;
  error?: string | null;
}

const formatBeta = (beta: number | null | undefined) => {
  if (beta == null || Number.isNaN(beta)) return "–";
  const formatted = Math.abs(beta) >= 1 ? beta.toFixed(2) : beta.toFixed(2);
  return `${beta > 0 ? "+" : ""}${formatted}`;
};

const formatPValue = (pValue: string | null | undefined) => pValue ?? "n/a";

const strengthColor = (strength: RegressionInsight["strength"]) => {
  switch (strength) {
    case "strong":
      return "bg-chart-1";
    case "moderate":
      return "bg-chart-2";
    case "weak":
      return "bg-chart-3";
    default:
      return "bg-muted";
  }
};

const strengthLabel = (strength: RegressionInsight["strength"]) => {
  switch (strength) {
    case "strong":
      return "Strong";
    case "moderate":
      return "Moderate";
    case "weak":
      return "Weak";
    default:
      return "Indirect";
  }
};

const LoadingState = () => (
  <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
    <CardHeader>
      <Skeleton className="h-6 w-60" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-24 w-full" />
    </CardContent>
  </Card>
);

const PathDiagram = ({ regression, summary, isLoading = false, error }: PathDiagramProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Card className="border-0 shadow-xl bg-destructive/10 border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Unable to load predictor insights</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!regression || regression.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Predictors of Contraceptive Use</CardTitle>
              <CardDescription className="text-base mt-1">
                Differences in key drivers between respondents who report current use and those who do not
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Provide Google Sheets columns for motivation, ability, norms, system readiness, and prompt effectiveness to unlock this
          analysis.
        </CardContent>
      </Card>
    );
  }

  const maxBeta = Math.max(
    ...regression
      .map((item) => (item.beta == null ? 0 : Math.abs(item.beta)))
      .filter((value) => Number.isFinite(value)),
    1
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Predictors of Contraceptive Use</CardTitle>
              <CardDescription className="text-base mt-1">
                Differences in key drivers between respondents who report current use and those who do not
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 rounded-lg border bg-muted/30">
            <div className="space-y-4">
              {regression.map((predictor) => {
                const width = predictor.beta == null ? 0 : (Math.abs(predictor.beta) / maxBeta) * 100;
                return (
                  <div key={predictor.variable} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{predictor.variable}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-muted font-semibold text-muted-foreground`}>
                            {strengthLabel(predictor.strength)} impact
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{predictor.interpretation}</p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground w-32">
                        <div className="font-semibold text-foreground">Δ {formatBeta(predictor.beta)}</div>
                        <div>p-value {formatPValue(predictor.pValue)}</div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`${strengthColor(predictor.strength)} h-full transition-all duration-500`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {summary && summary.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {summary.map((item) => (
                <Card key={item.label} className="bg-muted/40 border-muted/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                      {item.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{item.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{item.helper}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          <div className="p-4 rounded-lg border bg-primary/5 border-primary/30">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1 space-y-3 text-sm text-muted-foreground">
                <p>
                  Values represent differences in average scores between current users and non-users recorded through Google Sheets. Use
                  the strongest drivers to prioritise programmatic responses and monitor change as new submissions arrive.
                </p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Positive values indicate higher scores among current users.</li>
                  <li>Negative values signal areas where non-users report higher scores, highlighting potential barriers.</li>
                  <li>Updates flow automatically with each new submission.</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PathDiagram;
