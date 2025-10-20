import { Info } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PromptEffectivenessRow } from "@/lib/googleSheets";

interface PromptEffectivenessHeatmapProps {
  rows?: PromptEffectivenessRow[];
  isLoading?: boolean;
  error?: string | null;
}

const PROMPT_FIELDS = [
  { key: "facilitator", label: "Facilitator" },
  { key: "spark", label: "Spark" },
  { key: "signal", label: "Signal" },
] as const;

const formatCellValue = (value: number | null) => {
  if (value == null || Number.isNaN(value)) {
    return "n/a";
  }
  return value.toFixed(2);
};

const toRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace("#", "");
  const matches = normalized.match(/.{2}/g);
  if (!matches) {
    return [0, 0, 0];
  }
  return matches.map((component) => parseInt(component, 16)) as [number, number, number];
};

const lerpColor = (ratio: number, start: string, end: string): string => {
  const [r1, g1, b1] = toRgb(start);
  const [r2, g2, b2] = toRgb(end);
  const clamp = Math.max(0, Math.min(1, ratio));
  const r = Math.round(r1 + (r2 - r1) * clamp);
  const g = Math.round(g1 + (g2 - g1) * clamp);
  const b = Math.round(b1 + (b2 - b1) * clamp);
  return `rgb(${r}, ${g}, ${b})`;
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

  if (!rows || rows.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">No prompt data available</CardTitle>
          <CardDescription>
            Provide facilitator, spark, and signal prompt responses in the sheet to populate the effectiveness heatmap.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const numericValues = rows
    .flatMap((row) => PROMPT_FIELDS.map(({ key }) => row[key]))
    .filter((value): value is number => value != null && Number.isFinite(value));
  const minValue = numericValues.length > 0 ? Math.min(...numericValues) : 0;
  const maxValue = numericValues.length > 0 ? Math.max(...numericValues) : 0;
  const scaleMin = Math.min(1, minValue);
  const preliminaryMax = Math.max(5, maxValue);
  const scaleMax = scaleMin === preliminaryMax ? scaleMin + 1 : preliminaryMax;

  const getCellColor = (value: number | null) => {
    if (value == null || Number.isNaN(value)) {
      return "var(--muted)";
    }
    const ratio = (value - scaleMin) / (scaleMax - scaleMin);
    return lerpColor(ratio, "#dbeafe", "#1e3a8a");
  };

  let topCell: { segment: string; prompt: string; value: number } | null = null;
  rows.forEach((row) => {
    PROMPT_FIELDS.forEach(({ key, label }) => {
      const value = row[key];
      if (value != null && Number.isFinite(value) && (!topCell || value > topCell.value)) {
        topCell = { segment: row.name, prompt: label, value };
      }
    });
  });

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
              Average prompt scores derived from the latest Google Sheets responses (1–5 scale)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative overflow-hidden rounded-xl border bg-background/80 shadow-inner">
          <svg viewBox="0 0 600 440" className="w-full h-full" role="img" aria-labelledby="heatmap-title">
            <title id="heatmap-title">
              Prompt effectiveness heatmap showing average facilitator, spark, and signal scores by behavioural segment
            </title>
            <text x="300" y="35" textAnchor="middle" fontSize="24" fontWeight="600" fill="var(--foreground)">
              Prompt Effectiveness by Segment
            </text>
            <g transform="translate(120, 80)">
              {rows.map((row, rowIndex) => (
                <text
                  key={row.id}
                  x={-10}
                  y={rowIndex * 80 + 45}
                  fontSize="16"
                  fill="var(--muted-foreground)"
                  textAnchor="end"
                >
                  {row.name}
                </text>
              ))}
              {PROMPT_FIELDS.map(({ label }, colIndex) => (
                <text
                  key={label}
                  x={colIndex * 140 + 70}
                  y={-20}
                  fontSize="16"
                  fill="var(--muted-foreground)"
                  textAnchor="middle"
                >
                  {label}
                </text>
              ))}
              {rows.map((row, rowIndex) =>
                PROMPT_FIELDS.map(({ key, label }, colIndex) => {
                  const value = row[key] ?? null;
                  return (
                    <g key={`${row.id}-${label}`} transform={`translate(${colIndex * 140}, ${rowIndex * 80})`}>
                      <rect width="140" height="80" rx="12" fill={getCellColor(value)} opacity="0.95" />
                      <text
                        x="70"
                        y="48"
                        fontSize="22"
                        fontWeight="600"
                        fill={value != null && value >= (scaleMin + scaleMax) / 2 ? "#fff" : "#0f172a"}
                        textAnchor="middle"
                      >
                        {formatCellValue(value)}
                      </text>
                    </g>
                  );
                }),
              )}
            </g>
            <g transform="translate(480, 90)">
              {[0, 0.25, 0.5, 0.75, 1].map((step) => (
                <g key={step} transform={`translate(0, ${step * 100})`}>
                  <rect x="0" y="0" width="18" height="18" rx="4" fill={lerpColor(step, "#dbeafe", "#1e3a8a")} />
                  <text x="28" y="14" fontSize="14" fill="var(--muted-foreground)">
                    {formatCellValue(scaleMin + (scaleMax - scaleMin) * step)}
                  </text>
                </g>
              ))}
              <text x="0" y="-16" fontSize="14" fill="var(--muted-foreground)" fontWeight="500">
                Average score
              </text>
            </g>
          </svg>
        </div>
        <div className="p-4 rounded-lg border bg-muted/50 text-sm text-muted-foreground">
          {topCell
            ? `${topCell.prompt} prompts score highest with ${topCell.segment} (${topCell.value.toFixed(2)} / 5).`
            : "Prompt scores were present but no numeric values could be summarised."}
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptEffectivenessHeatmap;
