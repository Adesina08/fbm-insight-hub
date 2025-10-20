import { useState } from "react";
import Plot from "react-plotly.js";
import { Target, Info } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScatterPoint } from "@/lib/googleSheets";

interface FBMQuadrantChartProps {
  points?: ScatterPoint[];
  isLoading?: boolean;
  error?: string | null;
}

const LoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-[400px] w-full" />
  </div>
);

const EmptyState = () => (
  <div className="p-6 text-sm text-muted-foreground bg-muted/20 rounded-lg">
    Google Sheet rows must include motivation, ability, and current use indicators to render the quadrant plot.
  </div>
);

const FBMQuadrantChart = ({ points, isLoading = false, error }: FBMQuadrantChartProps) => {
  const [overlayType, setOverlayType] = useState<"norms" | "system">("norms");

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
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
      <Card className="border-0 shadow-xl bg-destructive/10 border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Unable to load FBM quadrant chart</CardTitle>
          <CardDescription className="text-destructive">
            {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!points || points.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">FBM Quadrant Analysis</CardTitle>
              <CardDescription className="text-base mt-1">
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
  const overlayLabel = overlayType === "norms" ? "Average Norms" : "System Readiness";

  const createMarkerSize = (value: number | null) => 6 + (value ?? 0) * 3;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">FBM Quadrant Analysis</CardTitle>
                <CardDescription className="text-base mt-1">
                  Motivation vs Ability scatter plot with behavior outcomes
                </CardDescription>
              </div>
            </div>
            <Select value={overlayType} onValueChange={(val) => setOverlayType(val as "norms" | "system")}>
              <SelectTrigger className="w-[200px] bg-background/50">
                <SelectValue placeholder="Overlay" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="norms">Social Norms Overlay</SelectItem>
                <SelectItem value="system">System Readiness Overlay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[520px] md:h-[580px]">
            <Plot
              data={[
                {
                  x: users.map((d) => d.ability),
                  y: users.map((d) => d.motivation),
                  mode: "markers" as const,
                  type: "scatter" as const,
                  name: "Current Users",
                  marker: {
                    size: users.map((d) =>
                      overlayType === "norms"
                        ? createMarkerSize(d.norms)
                        : createMarkerSize(d.system)
                    ),
                    color: "#22c55e",
                    opacity: 0.7,
                    line: { color: "#16a34a", width: 1 },
                  },
                  hovertemplate:
                    `<b>Current User</b><br>` +
                    `Ability: %{x:.1f}<br>` +
                    `Motivation: %{y:.1f}<br>` +
                    `${overlayLabel}: %{marker.size:.1f}<br>` +
                    "<extra></extra>",
                },
                {
                  x: nonUsers.map((d) => d.ability),
                  y: nonUsers.map((d) => d.motivation),
                  mode: "markers" as const,
                  type: "scatter" as const,
                  name: "Non-Users",
                  marker: {
                    size: nonUsers.map((d) =>
                      overlayType === "norms"
                        ? createMarkerSize(d.norms)
                        : createMarkerSize(d.system)
                    ),
                    color: "#a855f7",
                    opacity: 0.6,
                    line: { color: "#9333ea", width: 1 },
                  },
                  hovertemplate:
                    `<b>Non-User</b><br>` +
                    `Ability: %{x:.1f}<br>` +
                    `Motivation: %{y:.1f}<br>` +
                    `${overlayLabel}: %{marker.size:.1f}<br>` +
                    "<extra></extra>",
                },
              ]}
              layout={{
                width: undefined,
                height: undefined,
                autosize: true,
                paper_bgcolor: "rgba(0,0,0,0)",
                plot_bgcolor: "rgba(248,250,252,0.6)",
                hovermode: "closest",
                font: { family: "inherit" },
                hoverlabel: {
                  bgcolor: "#111827",
                  bordercolor: "#111827",
                  font: { family: "inherit" },
                },
                xaxis: {
                  title: { text: "Ability Score", font: { size: 16, family: "inherit" } },
                  range: [0, 5.5],
                  gridcolor: "#e2e8f0",
                  gridwidth: 1,
                  zeroline: true,
                  zerolinecolor: "#9ca3af",
                  tick0: 0,
                  dtick: 1,
                  tickfont: { family: "inherit", color: "#475569" },
                },
                yaxis: {
                  title: { text: "Motivation Score", font: { size: 16, family: "inherit" } },
                  range: [0, 5.5],
                  gridcolor: "#e2e8f0",
                  gridwidth: 1,
                  zeroline: true,
                  zerolinecolor: "#9ca3af",
                  tick0: 0,
                  dtick: 1,
                  tickfont: { family: "inherit", color: "#475569" },
                },
                shapes: [
                  {
                    type: "line" as const,
                    x0: 3, x1: 3,
                    y0: 0, y1: 5.5,
                    line: { color: "#6b7280", width: 2, dash: "dash" },
                  },
                  {
                    type: "line" as const,
                    x0: 0, x1: 5.5,
                    y0: 3, y1: 3,
                    line: { color: "#6b7280", width: 2, dash: "dash" },
                  },
                  {
                    type: "rect" as const,
                    x0: 0, x1: 3, y0: 0, y1: 3,
                    fillcolor: "#ef4444",
                    opacity: 0.08,
                    layer: "below" as const,
                    line: { width: 0 },
                  },
                  {
                    type: "rect" as const,
                    x0: 3, x1: 5.5, y0: 0, y1: 3,
                    fillcolor: "#a855f7",
                    opacity: 0.08,
                    layer: "below" as const,
                    line: { width: 0 },
                  },
                  {
                    type: "rect" as const,
                    x0: 0, x1: 3, y0: 3, y1: 5.5,
                    fillcolor: "#22c55e",
                    opacity: 0.08,
                    layer: "below" as const,
                    line: { width: 0 },
                  },
                  {
                    type: "rect" as const,
                    x0: 3, x1: 5.5, y0: 3, y1: 5.5,
                    fillcolor: "#fde047",
                    opacity: 0.08,
                    layer: "below" as const,
                    line: { width: 0 },
                  },
                ],
                annotations: [
                  {
                    text: "Low Motivation<br>Low Ability",
                    x: 1.5,
                    y: 1.5,
                    xref: "x",
                    yref: "y",
                    showarrow: false,
                    font: { size: 14, color: "#1f2937", family: "inherit" },
                    align: "center",
                    bgcolor: "rgba(255,255,255,0.8)",
                    borderpad: 6,
                    bordercolor: "rgba(15,23,42,0.12)",
                  },
                  {
                    text: "Low Motivation<br>High Ability",
                    x: 4.2,
                    y: 1.5,
                    xref: "x",
                    yref: "y",
                    showarrow: false,
                    font: { size: 14, color: "#312e81", family: "inherit" },
                    align: "center",
                    bgcolor: "rgba(255,255,255,0.85)",
                    borderpad: 6,
                    bordercolor: "rgba(79,70,229,0.18)",
                  },
                  {
                    text: "High Motivation<br>Low Ability",
                    x: 1.5,
                    y: 4.2,
                    xref: "x",
                    yref: "y",
                    showarrow: false,
                    font: { size: 14, color: "#065f46", family: "inherit" },
                    align: "center",
                    bgcolor: "rgba(255,255,255,0.85)",
                    borderpad: 6,
                    bordercolor: "rgba(22,101,52,0.18)",
                  },
                  {
                    text: "High Motivation<br>High Ability",
                    x: 4.2,
                    y: 4.2,
                    xref: "x",
                    yref: "y",
                    showarrow: false,
                    font: { size: 14, color: "#92400e", family: "inherit" },
                    align: "center",
                    bgcolor: "rgba(255,255,255,0.85)",
                    borderpad: 6,
                    bordercolor: "rgba(180,83,9,0.18)",
                  },
                ],
                legend: {
                  orientation: "h",
                  yanchor: "bottom",
                  y: 1.02,
                  xanchor: "right",
                  x: 1,
                  font: { family: "inherit" },
                  bgcolor: "rgba(255,255,255,0.9)",
                  bordercolor: "rgba(148,163,184,0.4)",
                  borderwidth: 1,
                },
                margin: { l: 60, r: 40, t: 40, b: 60 },
              }}
              config={{ displayModeBar: false, responsive: true }}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-chart-3 shadow-lg">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">How to read this chart</CardTitle>
              <CardDescription className="text-base mt-1">
                Each dot represents an interview. Size reflects either social norms or system readiness scores.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            Use the overlay selector to switch between norms and system readiness. Larger markers indicate higher scores for the
            selected driver, helping you spot leverage points by quadrant.
          </p>
          <p>
            The chart refreshes automatically when the connected Google Sheet receives a new row, ensuring the behavioural
            segmentation remains live.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FBMQuadrantChart;
