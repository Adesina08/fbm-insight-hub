import { Info } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PromptEffectivenessRow } from "@/lib/googleSheets";

interface PromptEffectivenessHeatmapProps {
  rows?: PromptEffectivenessRow[];
  isLoading?: boolean;
  error?: string | null;
}

const HEATMAP_SEGMENTS = [
  "Empowered Adopters",
  "Willing but Hindered",
  "Passive Resisters",
  "Isolated Non-Users",
];

const HEATMAP_PROMPTS = ["Facilitator", "Spark", "Signal"];

const HEATMAP_VALUES: number[][] = [
  [6, 4, 8],
  [9, 5, 3],
  [3, 8, 4],
  [2, 4, 2],
];

const colorStops = [
  { value: 2, color: "#e5f5ff" },
  { value: 4, color: "#9ecae1" },
  { value: 6, color: "#4292c6" },
  { value: 8, color: "#2171b5" },
  { value: 9, color: "#084594" },
];

const interpolateColor = (value: number) => {
  const clamped = Math.max(2, Math.min(9, value));
  for (let i = 0; i < colorStops.length - 1; i += 1) {
    const current = colorStops[i];
    const next = colorStops[i + 1];
    if (clamped <= next.value) {
      const range = next.value - current.value;
      const t = range === 0 ? 0 : (clamped - current.value) / range;
      const toRGB = (hex: string) =>
        hex
          .replace("#", "")
          .match(/.{2}/g)
          ?.map((component) => parseInt(component, 16)) ?? [0, 0, 0];
      const [r1, g1, b1] = toRGB(current.color);
      const [r2, g2, b2] = toRGB(next.color);
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return colorStops[colorStops.length - 1].color;
};

const LoadingState = () => (
  <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
    <CardHeader>
      <Skeleton className="h-6 w-56" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-72 w-full" />
    </CardContent>
  </Card>
);

const PromptEffectivenessHeatmap = ({ isLoading = false, error }: PromptEffectivenessHeatmapProps) => {
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
              Heatmap of qualitative prompt effectiveness scores mirroring the provided reference chart
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative overflow-hidden rounded-xl border bg-background/80 shadow-inner">
          <svg viewBox="0 0 600 440" className="w-full h-full" role="img" aria-labelledby="heatmap-title">
            <title id="heatmap-title">
              Prompt Effectiveness heatmap displaying facilitator, spark, and signal prompt performance by segment
            </title>
            <text x="300" y="35" textAnchor="middle" fontSize="24" fontWeight="600" fill="var(--foreground)">
              Prompt Effectiveness by Segment
            </text>
            <g transform="translate(120, 80)">
              {HEATMAP_SEGMENTS.map((segment, rowIndex) => (
                <text
                  key={segment}
                  x={-10}
                  y={rowIndex * 80 + 45}
                  fontSize="16"
                  fill="var(--muted-foreground)"
                  textAnchor="end"
                >
                  {segment}
                </text>
              ))}
              {HEATMAP_PROMPTS.map((prompt, colIndex) => (
                <text
                  key={prompt}
                  x={colIndex * 140 + 70}
                  y={-20}
                  fontSize="16"
                  fill="var(--muted-foreground)"
                  textAnchor="middle"
                >
                  {prompt}
                </text>
              ))}
              {HEATMAP_VALUES.map((row, rowIndex) =>
                row.map((value, colIndex) => (
                  <g key={`${rowIndex}-${colIndex}`} transform={`translate(${colIndex * 140}, ${rowIndex * 80})`}>
                    <rect width="140" height="80" rx="12" fill={interpolateColor(value)} opacity="0.95" />
                    <text
                      x="70"
                      y="48"
                      fontSize="24"
                      fontWeight="600"
                      fill={value >= 6 ? "#fff" : "#0f172a"}
                      textAnchor="middle"
                    >
                      {value}
                    </text>
                  </g>
                ))
              )}
            </g>
            <g transform="translate(480, 90)">
              <rect x="0" y="0" width="18" height="18" fill="#e5f5ff" rx="4" />
              <rect x="0" y="26" width="18" height="18" fill="#9ecae1" rx="4" />
              <rect x="0" y="52" width="18" height="18" fill="#4292c6" rx="4" />
              <rect x="0" y="78" width="18" height="18" fill="#2171b5" rx="4" />
              <rect x="0" y="104" width="18" height="18" fill="#084594" rx="4" />
              {["2", "4", "6", "8", "9"].map((label, index) => (
                <text key={label} x="28" y={14 + index * 26} fontSize="14" fill="var(--muted-foreground)">
                  Effectiveness {label}
                </text>
              ))}
              <text x="0" y="-16" fontSize="14" fill="var(--muted-foreground)" fontWeight="500">
                Effectiveness Scale
              </text>
            </g>
          </svg>
        </div>
        <div className="p-4 rounded-lg border bg-muted/50 text-sm text-muted-foreground">
          The recreation closely follows the supplied reference heatmap. It highlights that facilitator prompts resonate most
          with Empowered Adopters, spark prompts are most valuable for Passive Resisters, and signal prompts reinforce actions
          among current users.
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptEffectivenessHeatmap;
