import { Fragment } from "react";
import { Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuadrantId, SegmentSummary } from "@/lib/googleSheets";

interface SegmentProfilesProps {
  segments?: SegmentSummary[];
  isLoading?: boolean;
  error?: string | null;
}

const SEGMENT_COLORS: Record<QuadrantId, string> = {
  high_m_high_a: "#22c55e",
  high_m_low_a: "#f59e0b",
  low_m_high_a: "#3b82f6",
  low_m_low_a: "#ef4444",
};

const METRICS = ["Motivation", "Ability", "Norms", "System"] as const;

type MetricLabel = (typeof METRICS)[number];

const average = (values: Array<number | null | undefined>): number | null => {
  const valid = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (valid.length === 0) {
    return null;
  }
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

const formatMetric = (value: number | null) => {
  if (value == null || Number.isNaN(value)) {
    return "n/a";
  }
  return value.toFixed(2);
};

const LoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-56" />
    <Skeleton className="h-[480px] w-full" />
  </div>
);

const polarToCartesian = (angle: number, value: number, radius: number, center: number) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  const scaled = (value / 5) * radius;
  return {
    x: center + scaled * Math.cos(radians),
    y: center + scaled * Math.sin(radians),
  };
};

const RadarChart = ({ segment }: { segment: SegmentSummary }) => {
  const size = 240;
  const center = size / 2;
  const radius = size / 2 - 24;
  const angleStep = 360 / METRICS.length;

  const normsAverage = average([
    segment.characteristics.descriptiveNorms,
    segment.characteristics.injunctiveNorms,
  ]);

  const metricValues: Record<MetricLabel, number | null> = {
    Motivation: segment.characteristics.motivation,
    Ability: segment.characteristics.ability,
    Norms: normsAverage,
    System: segment.characteristics.systemReadiness,
  };

  const strokeColor = SEGMENT_COLORS[segment.id] ?? "#6366f1";

  const points = METRICS.map((metric, index) => {
    const value = metricValues[metric] ?? 0;
    const { x, y } = polarToCartesian(index * angleStep, value, radius, center);
    return `${x},${y}`;
  }).join(" ");

  const gridRadii = [1, 2, 3, 4, 5];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full" role="img" aria-label={`${segment.name} radar chart`}>
      <defs>
        <linearGradient id={`radar-fill-${segment.id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <circle cx={center} cy={center} r={radius} fill="var(--card)" opacity="0.25" />
      {gridRadii.map((gridValue) => (
        <circle
          key={gridValue}
          cx={center}
          cy={center}
          r={(gridValue / 5) * radius}
          fill="none"
          stroke="var(--muted)"
          strokeDasharray="4 4"
          strokeWidth={0.8}
        />
      ))}
      {METRICS.map((metric, index) => {
        const { x, y } = polarToCartesian(index * angleStep, 5, radius, center);
        return (
          <g key={metric}>
            <line x1={center} y1={center} x2={x} y2={y} stroke="var(--muted)" strokeWidth={1} />
            <text x={x} y={y} dy={8} textAnchor="middle" fontSize="12" fill="var(--muted-foreground)">
              {metric}
            </text>
          </g>
        );
      })}
      <polygon points={points} fill={`url(#radar-fill-${segment.id})`} stroke={strokeColor} strokeWidth={3} />
      {METRICS.map((metric, index) => {
        const value = metricValues[metric] ?? 0;
        const { x, y } = polarToCartesian(index * angleStep, value, radius, center);
        return <circle key={metric} cx={x} cy={y} r={5} fill={strokeColor} stroke="#fff" strokeWidth={1.5} />;
      })}
    </svg>
  );
};

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

  if (!segments || segments.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">No segment insights available</CardTitle>
          <CardDescription>
            Submitters must include motivation, ability, norms, and system fields for segment analytics to render.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalRespondents = segments.reduce((sum, segment) => sum + segment.count, 0);

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
                Radar charts derived from Google Sheets submissions showing average scores by segment
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            {segments.map((segment) => {
              const normsAverage = average([
                segment.characteristics.descriptiveNorms,
                segment.characteristics.injunctiveNorms,
              ]);

              return (
                <div key={segment.id} className="space-y-4">
                  <div className="space-y-2 text-center">
                    <h3 className="text-lg font-semibold text-foreground">{segment.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {segment.count} respondents ({segment.percentage.toFixed(1)}%) · Current use
                      {" "}
                      {segment.currentUseRate == null
                        ? "n/a"
                        : `${Math.round(segment.currentUseRate * 100)}%`}
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-background/70 p-4 shadow-inner">
                    <RadarChart segment={segment} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                    {METRICS.map((metric) => {
                      const value: number | null =
                        metric === "Norms"
                          ? normsAverage
                          : metric === "Motivation"
                            ? segment.characteristics.motivation
                            : metric === "Ability"
                              ? segment.characteristics.ability
                              : segment.characteristics.systemReadiness;
                      return (
                        <Fragment key={`${segment.id}-${metric}`}>
                          <span className="font-medium text-foreground">{metric}</span>
                          <span>{formatMetric(value)}</span>
                        </Fragment>
                      );
                    })}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{segment.description}</p>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground">
            Segment averages use all {totalRespondents} submissions that contained enough information to classify motivation,
            ability, social norms, and system readiness.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SegmentProfiles;
