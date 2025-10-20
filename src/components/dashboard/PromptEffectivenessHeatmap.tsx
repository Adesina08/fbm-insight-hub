import { Info } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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

  const getCellVisuals = (value: number | null) => {
    if (value == null || Number.isNaN(value)) {
      return {
        background: "var(--muted)",
        text: "var(--muted-foreground)",
      };
    }
    const ratio = (value - scaleMin) / (scaleMax - scaleMin);
    return {
      background: lerpColor(ratio, "#dbeafe", "#1e3a8a"),
      text: ratio > 0.55 ? "#f8fafc" : "#0f172a",
    };
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
        <div className="rounded-2xl border bg-background/85 p-4 shadow-inner">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] table-fixed border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 rounded-tl-xl bg-background/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Segment
                  </th>
                  {PROMPT_FIELDS.map(({ label }, index) => {
                    const isLast = index === PROMPT_FIELDS.length - 1;
                    return (
                      <th
                        key={label}
                        className={`bg-background/95 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground ${
                          isLast ? "rounded-tr-xl" : ""
                        }`}
                      >
                        {label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={row.id} className="border-t border-border/60">
                    <th
                      scope="row"
                      className={`sticky left-0 bg-background/90 px-4 py-4 text-left text-sm font-semibold text-foreground ${
                        rowIndex === rows.length - 1 ? "rounded-bl-xl" : ""
                      }`}
                    >
                      {row.name}
                    </th>
                    {PROMPT_FIELDS.map(({ key, label }) => {
                      const value = row[key] ?? null;
                      const visuals = getCellVisuals(value);
                      return (
                        <td key={`${row.id}-${label}`} className="px-3 py-3">
                          <div
                            className="flex min-h-[88px] flex-col items-center justify-center rounded-xl border border-white/10 shadow-sm"
                            style={{
                              background: visuals.background,
                              color: visuals.text,
                            }}
                          >
                            <span className="text-lg font-semibold">{formatCellValue(value)}</span>
                            <span className="text-[11px] uppercase tracking-wide opacity-80">Avg score</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scale</span>
            <div className="h-2 w-36 rounded-full bg-gradient-to-r from-[#dbeafe] via-[#60a5fa] to-[#1e3a8a]" />
            <div className="flex items-center gap-2 text-xs">
              <span>Low</span>
              <span className="font-semibold text-foreground">High</span>
            </div>
          </div>
          {topCell ? (
            <Badge variant="secondary" className="w-fit bg-background/80 px-4 py-2 text-xs font-medium text-foreground shadow-sm">
              {topCell.prompt} prompts resonate most with {topCell.segment} ({topCell.value.toFixed(2)} / 5)
            </Badge>
          ) : null}
        </div>
        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="text-foreground">
            {topCell
              ? `${topCell.prompt} prompts score highest with ${topCell.segment} (${topCell.value.toFixed(2)} / 5).`
              : "Prompt scores were present but no numeric values could be summarised."}
          </p>
          <p className="mt-2 text-xs">
            Scores span the observed range of {formatCellValue(scaleMin)} to {formatCellValue(scaleMax)}, with deeper blues
            representing stronger average responses.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptEffectivenessHeatmap;
