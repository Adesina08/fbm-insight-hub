import { Info } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PromptEffectivenessRow } from "@/lib/kobo";

interface PromptEffectivenessHeatmapProps {
  rows?: PromptEffectivenessRow[];
  isLoading?: boolean;
  error?: string | null;
}

const formatScore = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return "–";
  return value.toFixed(2);
};

const getColorClass = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return "bg-muted";
  if (value >= 4) return "bg-chart-1";
  if (value >= 3) return "bg-chart-2";
  if (value >= 2) return "bg-chart-3";
  return "bg-chart-4";
};

const getTextColor = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return "text-muted-foreground";
  return value >= 3 ? "text-white" : "text-foreground";
};

const LoadingState = () => (
  <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
    <CardHeader>
      <Skeleton className="h-6 w-56" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </CardContent>
  </Card>
);

const PromptEffectivenessHeatmap = ({ rows, isLoading = false, error }: PromptEffectivenessHeatmapProps) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Card className="border-0 shadow-xl bg-destructive/10 border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Unable to load prompt effectiveness</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!rows || rows.every((row) => row.facilitator == null && row.spark == null && row.signal == null)) {
    return (
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Prompt Effectiveness by Segment</CardTitle>
              <CardDescription className="text-base mt-1">
                How different prompt types perform across behavioral segments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Kobo submissions must include fields for facilitator, spark, or signal prompt usefulness (1-5 scale) for this view to
          populate.
        </CardContent>
      </Card>
    );
  }

  const averageOf = (values: Array<number | null | undefined>) => {
    const filtered = values.filter((value): value is number => value != null && !Number.isNaN(value));
    if (filtered.length === 0) return null;
    return filtered.reduce((acc, value) => acc + value, 0) / filtered.length;
  };

  const averages = {
    facilitator: averageOf(rows.map((row) => row.facilitator)),
    spark: averageOf(rows.map((row) => row.spark)),
    signal: averageOf(rows.map((row) => row.signal)),
  };

  return (
    <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Prompt Effectiveness by Segment</CardTitle>
            <CardDescription className="text-base mt-1">
              How different prompt types (Facilitator, Spark, Signal) perform across behavioral segments
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Segment</th>
                <th className="text-center p-3 font-semibold">Facilitator</th>
                <th className="text-center p-3 font-semibold">Spark</th>
                <th className="text-center p-3 font-semibold">Signal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="p-3 font-medium">{row.name}</td>
                  {[row.facilitator, row.spark, row.signal].map((value, index) => (
                    <td key={index} className="p-3">
                      <div className={`${getColorClass(value)} ${getTextColor(value)} rounded py-2 px-4 text-center font-semibold`}>
                        {formatScore(value)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <span className="font-medium">Average effectiveness:</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-chart-1" />
            <span>Facilitator {formatScore(averages.facilitator)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-chart-2" />
            <span>Spark {formatScore(averages.spark)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-chart-3" />
            <span>Signal {formatScore(averages.signal)}</span>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-muted/50">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-1">How to interpret</h4>
                <p className="text-sm text-muted-foreground">
                  Scores reflect average usefulness ratings submitted directly through Kobo. Use higher-scoring prompt types to
                  reinforce each segment.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Recommendations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>Facilitator prompts</strong> help high-motivation segments overcome barriers.</li>
                  <li><strong>Spark prompts</strong> lift motivation among groups with adequate ability.</li>
                  <li><strong>Signal prompts</strong> sustain behaviours within high-performing segments.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptEffectivenessHeatmap;
