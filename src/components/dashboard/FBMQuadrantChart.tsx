import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  type TooltipProps,
} from "recharts";
import { Target } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScatterPoint } from "@/lib/googleSheets";

interface FBMQuadrantChartProps {
  points?: ScatterPoint[];
  isLoading?: boolean;
  error?: string | null;
}

interface ChartPoint extends ScatterPoint {
  x: number;
  y: number;
  size: number;
  segment: "Current User" | "Non-User";
}

type OverlayOption = "norms" | "system";

const OVERLAY_DEFINITIONS: ReadonlyArray<{ value: OverlayOption; label: string }> = [
  { value: "norms", label: "Social Norms Overlay" },
  { value: "system", label: "System Readiness Overlay" },
] as const;

const OVERLAY_LABELS: Record<OverlayOption, string> = {
  norms: "Social Norms",
  system: "System Readiness",
};

const LoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-[400px] w-full" />
  </div>
);

const EmptyState = () => (
  <div className="rounded-lg bg-muted/20 p-6 text-sm text-muted-foreground">
    Google Sheet rows must include motivation, ability, and current use indicators to render the quadrant plot.
  </div>
);

const createMarkerSize = (value: number | null) => 6 + (value ?? 0) * 3;

const FBMQuadrantChart = ({ points, isLoading = false, error }: FBMQuadrantChartProps) => {
  const [overlaySelection, setOverlaySelection] = useState<OverlayOption[]>(["norms"]);

  const normalizedSelection = overlaySelection.length > 0 ? overlaySelection : ["norms"];

  const handleOverlayChange = (values: string[]) => {
    const validValues = values.filter((value): value is OverlayOption => value === "norms" || value === "system");
    if (validValues.length === 0) {
      setOverlaySelection(["norms"]);
      return;
    }

    setOverlaySelection(validValues);
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-card/50 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 border-destructive/30 bg-destructive/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-destructive">Unable to load FBM quadrant chart</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!points || points.length === 0) {
    return (
      <Card className="border-0 bg-card/50 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-gradient-to-br from-primary to-chart-3 p-3 shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">FBM Quadrant Analysis</CardTitle>
              <CardDescription className="mt-1 text-base">
                Motivation vs Ability scatter plot with behavior outcomes
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

  const users = points.filter((point) => point.currentUse);
  const nonUsers = points.filter((point) => !point.currentUse);

  const computeOverlayAverage = (point: ScatterPoint): number | null => {
    const values = normalizedSelection
      .map((key) => point[key])
      .filter((value): value is number => value != null && Number.isFinite(value));

    if (values.length === 0) {
      return null;
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    return total / values.length;
  };

  const mapPoint = (point: ScatterPoint, segment: ChartPoint["segment"]): ChartPoint => {
    const overlayValue = computeOverlayAverage(point);
    return {
      ...point,
      x: point.ability,
      y: point.motivation,
      size: createMarkerSize(overlayValue),
      segment,
    };
  };

  const userPoints = users.map((point) => mapPoint(point, "Current User"));
  const nonUserPoints = nonUsers.map((point) => mapPoint(point, "Non-User"));

  const renderTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const data = payload[0].payload as ChartPoint;

    return (
      <div className="rounded-lg border border-border bg-background/95 p-3 text-sm shadow-lg">
        <p className="font-medium text-foreground">{data.segment}</p>
        <p className="text-muted-foreground">Ability: {data.ability.toFixed(1)}</p>
        <p className="text-muted-foreground">Motivation: {data.motivation.toFixed(1)}</p>
        {normalizedSelection.map((key) => {
          const rawValue = (data as Record<OverlayOption, number | null>)[key];
          return (
            <p key={key} className="text-muted-foreground">
              {OVERLAY_LABELS[key]}: {rawValue != null && Number.isFinite(rawValue) ? rawValue.toFixed(1) : "n/a"}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-0 bg-card/50 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-1 items-start gap-3">
              <div className="rounded-xl bg-gradient-to-br from-primary to-chart-3 p-3 shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">FBM Quadrant Analysis</CardTitle>
                <CardDescription className="mt-1 text-base">
                  Motivation vs Ability scatter plot with behavior outcomes
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:block">
                Overlays
              </span>
              <ToggleGroup
                type="multiple"
                value={overlaySelection}
                onValueChange={handleOverlayChange}
                className="flex flex-wrap justify-end gap-2"
              >
                {OVERLAY_DEFINITIONS.map(({ value, label }) => (
                  <ToggleGroupItem
                    key={value}
                    value={value}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-primary/30 bg-background/70 px-3 py-1 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative h-[520px] w-full md:h-[580px]">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-[16%] top-[34%]">
                <div className="rounded-lg bg-white/80 px-3 py-2 text-xs font-medium text-slate-800 shadow-sm">
                  Low Motivation
                  <br />
                  Low Ability
                </div>
              </div>
              <div className="absolute right-[14%] top-[34%]">
                <div className="rounded-lg bg-white/85 px-3 py-2 text-xs font-medium text-indigo-900 shadow-sm">
                  Low Motivation
                  <br />
                  High Ability
                </div>
              </div>
              <div className="absolute bottom-[32%] left-[16%]">
                <div className="rounded-lg bg-white/85 px-3 py-2 text-xs font-medium text-emerald-700 shadow-sm">
                  High Motivation
                  <br />
                  Low Ability
                </div>
              </div>
              <div className="absolute bottom-[32%] right-[14%]">
                <div className="rounded-lg bg-white/85 px-3 py-2 text-xs font-medium text-amber-700 shadow-sm">
                  High Motivation
                  <br />
                  High Ability
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 50, right: 40, bottom: 60, left: 60 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[0, 5.5]}
                  tick={{ fill: "#475569", fontSize: 12 }}
                  tickCount={6}
                  label={{ value: "Ability Score", position: "bottom", offset: 25, style: { fill: "#0f172a", fontSize: 16 } }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[0, 5.5]}
                  tick={{ fill: "#475569", fontSize: 12 }}
                  tickCount={6}
                  label={{
                    value: "Motivation Score",
                    angle: -90,
                    position: "left",
                    offset: -40,
                    style: { fill: "#0f172a", fontSize: 16 },
                  }}
                />
                <ZAxis dataKey="size" type="number" range={[60, 220]} />
                <ReferenceLine x={3} stroke="#6b7280" strokeDasharray="4 4" strokeWidth={2} />
                <ReferenceLine y={3} stroke="#6b7280" strokeDasharray="4 4" strokeWidth={2} />
                <ReferenceArea x1={0} x2={3} y1={0} y2={3} fill="#ef4444" fillOpacity={0.08} />
                <ReferenceArea x1={3} x2={5.5} y1={0} y2={3} fill="#a855f7" fillOpacity={0.08} />
                <ReferenceArea x1={0} x2={3} y1={3} y2={5.5} fill="#22c55e" fillOpacity={0.08} />
                <ReferenceArea x1={3} x2={5.5} y1={3} y2={5.5} fill="#fde047" fillOpacity={0.1} />
                <Tooltip cursor={{ strokeDasharray: "4 4" }} content={renderTooltip} />
                <Legend
                  verticalAlign="top"
                  height={48}
                  wrapperStyle={{
                    top: 0,
                    right: 40,
                    padding: "6px 12px",
                    backgroundColor: "rgba(255,255,255,0.9)",
                    borderRadius: "12px",
                    border: "1px solid rgba(148,163,184,0.4)",
                  }}
                />
                <Scatter
                  name="Current Users"
                  data={userPoints}
                  fill="#22c55e"
                  stroke="#16a34a"
                  fillOpacity={0.7}
                  legendType="circle"
                />
                <Scatter
                  name="Non-Users"
                  data={nonUserPoints}
                  fill="#a855f7"
                  stroke="#9333ea"
                  fillOpacity={0.6}
                  legendType="circle"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FBMQuadrantChart;
