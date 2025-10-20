import { ListChecks, Sparkles, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

const FALLBACK_COLOR = "#6366f1";

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const normalizeHex = (hex: string) => {
  if (!hex) {
    return null;
  }
  const normalized = hex.replace("#", "");
  if (normalized.length === 3) {
    return normalized
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (normalized.length === 6) {
    return normalized;
  }
  return null;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return null;
  }
  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) {
    return null;
  }
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const mixColor = (hex: string, amount: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return amount >= 0 ? "rgb(147, 197, 253)" : "rgb(79, 70, 229)";
  }
  const factor = clamp(Math.abs(amount), 0, 1);
  const target = amount >= 0 ? 255 : 0;
  const mixComponent = (component: number) =>
    Math.round(component + (target - component) * factor);
  return `rgb(${mixComponent(rgb.r)}, ${mixComponent(rgb.g)}, ${mixComponent(rgb.b)})`;
};

const lightenColor = (hex: string, amount: number) => mixColor(hex, Math.abs(amount));

const darkenColor = (hex: string, amount: number) => mixColor(hex, -Math.abs(amount));

const withOpacity = (hex: string, alpha: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return `rgba(99, 102, 241, ${alpha})`;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

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
  const size = 280;
  const center = size / 2;
  const radius = size / 2 - 32;
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

  const strokeColor = SEGMENT_COLORS[segment.id] ?? FALLBACK_COLOR;
  const gradientId = `radar-fill-${segment.id}`;
  const glowId = `radar-glow-${segment.id}`;
  const backgroundId = `radar-background-${segment.id}`;
  const outlineGradientId = `radar-outline-${segment.id}`;
  const vertexGradientId = `radar-vertex-${segment.id}`;
  const panelGradientId = `radar-panel-${segment.id}`;
  const haloFilterId = `radar-halo-${segment.id}`;
  const gridGradientId = `radar-grid-${segment.id}`;
  const axisGradientPrefix = `radar-axis-${segment.id}`;

  const accentSoft = withOpacity(strokeColor, 0.16);
  const accentLighter = lightenColor(strokeColor, 0.35);
  const accentLight = lightenColor(strokeColor, 0.2);
  const accentDark = darkenColor(strokeColor, 0.2);
  const accentDeeper = darkenColor(strokeColor, 0.35);

  const axisDefinitions = METRICS.map((_, index) => {
    const { x, y } = polarToCartesian(index * angleStep, 5.2, radius, center);
    return {
      id: `${axisGradientPrefix}-${index}`,
      x1: center,
      y1: center,
      x2: x,
      y2: y,
    };
  });

  const points = METRICS.map((metric, index) => {
    const value = metricValues[metric] ?? 0;
    const { x, y } = polarToCartesian(index * angleStep, value, radius, center);
    return `${x},${y}`;
  }).join(" ");

  const gridRadii = [1, 2, 3, 4, 5];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[320px] drop-shadow-sm"
      role="img"
      aria-label={`${segment.name} radar chart`}
    >
      <defs>
        <linearGradient id={panelGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={withOpacity(strokeColor, 0.18)} />
          <stop offset="60%" stopColor={withOpacity(strokeColor, 0.08)} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accentLighter} stopOpacity="0.65" />
          <stop offset="65%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.08" />
        </linearGradient>
        <radialGradient id={backgroundId} cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor={withOpacity(strokeColor, 0.32)} />
          <stop offset="45%" stopColor={accentSoft} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id={outlineGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accentLighter} />
          <stop offset="100%" stopColor={accentDeeper} />
        </linearGradient>
        <linearGradient id={gridGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accentLight} stopOpacity="0.55" />
          <stop offset="100%" stopColor={accentDark} stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={vertexGradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={withOpacity(strokeColor, 0.9)} />
          <stop offset="55%" stopColor={withOpacity(strokeColor, 0.28)} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor={withOpacity(strokeColor, 0.2)} />
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={haloFilterId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" />
        </filter>
        {axisDefinitions.map((axis) => (
          <linearGradient
            key={axis.id}
            id={axis.id}
            gradientUnits="userSpaceOnUse"
            x1={axis.x1}
            y1={axis.y1}
            x2={axis.x2}
            y2={axis.y2}
          >
            <stop offset="0%" stopColor={withOpacity(strokeColor, 0.05)} />
            <stop offset="75%" stopColor={withOpacity(strokeColor, 0.18)} />
            <stop offset="100%" stopColor={withOpacity(strokeColor, 0.35)} />
          </linearGradient>
        ))}
      </defs>
      <rect width={size} height={size} fill={`url(#${panelGradientId})`} opacity={0.85} />
      <g filter={`url(#${haloFilterId})`} opacity={0.55}>
        <circle cx={center} cy={center} r={radius * 0.82} fill={accentSoft} />
      </g>
      <circle cx={center} cy={center} r={radius} fill={`url(#${backgroundId})`} />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="var(--card)"
        opacity="0.35"
        stroke={withOpacity(strokeColor, 0.18)}
        strokeWidth={1.2}
      />
      <circle
        cx={center}
        cy={center}
        r={radius * 0.92}
        fill="none"
        stroke={`url(#${gridGradientId})`}
        strokeDasharray="14 12"
        strokeWidth={1.1}
        opacity={0.5}
      />
      {gridRadii.map((gridValue) => (
        <circle
          key={gridValue}
          cx={center}
          cy={center}
          r={(gridValue / 5) * radius}
          fill="none"
          stroke={`url(#${gridGradientId})`}
          strokeDasharray={gridValue % 2 === 0 ? "4 6" : "8 10"}
          strokeWidth={gridValue === 5 ? 1.2 : 0.7}
          opacity={gridValue === 5 ? 0.75 : 0.45}
        />
      ))}
      {METRICS.map((metric, index) => {
        const axis = polarToCartesian(index * angleStep, 5, radius, center);
        const label = polarToCartesian(index * angleStep, 5.65, radius, center);
        return (
          <g key={metric}>
            <line
              x1={center}
              y1={center}
              x2={axis.x}
              y2={axis.y}
              stroke={`url(#${axisGradientPrefix}-${index})`}
              strokeWidth={1.2}
              strokeLinecap="round"
            />
            <text
              x={label.x}
              y={label.y}
              dy={6}
              textAnchor="middle"
              fontSize="12"
              fontWeight={600}
              letterSpacing={0.4}
              fill="var(--foreground)"
              style={{ paintOrder: "stroke fill" }}
              stroke="var(--card)"
              strokeWidth={4}
              opacity={0.9}
            >
              {metric}
            </text>
          </g>
        );
      })}
      <polygon
        points={points}
        fill={`url(#${gradientId})`}
        stroke={`url(#${outlineGradientId})`}
        strokeWidth={2.8}
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
        opacity={0.98}
      />
      <circle
        cx={center}
        cy={center}
        r={12}
        fill={withOpacity(strokeColor, 0.25)}
        filter={`url(#${haloFilterId})`}
      />
      <circle cx={center} cy={center} r={7} fill={strokeColor} opacity={0.85} stroke={accentLighter} strokeWidth={1.2} />
      <text
        x={center}
        y={center + 4}
        textAnchor="middle"
        fontSize={13}
        fontWeight={600}
        fill="var(--foreground)"
        style={{ paintOrder: "stroke fill" }}
        stroke="var(--card)"
        strokeWidth={5}
        opacity={0.92}
      >
        {segment.name}
      </text>
      {gridRadii.map((gridValue) => {
        if (gridValue === 5) {
          return null;
        }
        const marker = polarToCartesian(-90, gridValue, radius, center);
        return (
          <text
            key={`grid-${gridValue}`}
            x={marker.x}
            y={marker.y - 4}
            textAnchor="middle"
            fontSize={10}
            fill="var(--muted-foreground)"
            opacity={0.55}
          >
            {gridValue}
          </text>
        );
      })}
      {METRICS.map((metric, index) => {
        const rawValue = metricValues[metric];
        const value = rawValue ?? 0;
        const { x, y } = polarToCartesian(index * angleStep, value, radius, center);
        const labelPosition = polarToCartesian(
          index * angleStep,
          Math.min(value + 0.6, 5.75),
          radius,
          center,
        );
        return (
          <g key={metric}>
            <circle cx={x} cy={y} r={9} fill={`url(#${vertexGradientId})`} />
            <circle cx={x} cy={y} r={4.5} fill={strokeColor} stroke={accentLight} strokeWidth={1.5} />
            {rawValue != null ? (
              <text
                x={labelPosition.x}
                y={labelPosition.y + 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill={strokeColor}
                style={{ paintOrder: "stroke fill" }}
                stroke="var(--card)"
                strokeWidth={4}
              >
                {formatMetric(rawValue)}
              </text>
            ) : null}
          </g>
        );
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
                Radar charts derived from recent submissions showing average scores by segment
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
              const accent = SEGMENT_COLORS[segment.id] ?? "#6366f1";
              const insights = segment.insights ?? [];
              const recommendations = segment.recommendations ?? [];

              const accentSurface = withOpacity(accent, 0.12);
              const accentBorder = withOpacity(accent, 0.35);

              return (
                <div
                  key={segment.id}
                  className="relative overflow-hidden rounded-3xl border bg-card/60 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  style={{ borderColor: accentBorder, background: `linear-gradient(135deg, ${accentSurface} 0%, transparent 70%)` }}
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{segment.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {segment.count} respondents · {segment.percentage.toFixed(1)}% of total · Current use{" "}
                        {segment.currentUseRate == null ? "n/a" : `${Math.round(segment.currentUseRate * 100)}%`}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-background/90 text-xs font-semibold uppercase tracking-wide text-foreground shadow"
                    >
                      {segment.id.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                    <div className="rounded-2xl border border-white/10 bg-background/70 p-4 shadow-inner">
                      <RadarChart segment={segment} />
                    </div>
                    <div className="space-y-6">
                      <div className="grid gap-3">
                        {METRICS.map((metric) => {
                          const value: number | null =
                            metric === "Norms"
                              ? normsAverage
                              : metric === "Motivation"
                                ? segment.characteristics.motivation
                                : metric === "Ability"
                                  ? segment.characteristics.ability
                                  : segment.characteristics.systemReadiness;
                          const percentage =
                            value == null || Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, (value / 5) * 100));
                          return (
                            <div key={`${segment.id}-${metric}`} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                <span>{metric}</span>
                                <span className="text-foreground">{formatMetric(value)}</span>
                              </div>
                              <Progress value={percentage} className="h-2 bg-background/60" />
                            </div>
                          );
                        })}
                      </div>
                      <div className="space-y-3 text-sm">
                        {insights.length > 0 ? (
                          <div>
                            <div className="mb-2 flex items-center gap-2 text-foreground">
                              <Sparkles className="h-4 w-4" />
                              <span className="text-xs font-semibold uppercase tracking-wide">Key insights</span>
                            </div>
                            <ul className="space-y-1 text-muted-foreground">
                              {insights.map((insight) => (
                                <li key={insight} className="leading-snug">• {insight}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {recommendations.length > 0 ? (
                          <div>
                            <div className="mb-2 flex items-center gap-2 text-foreground">
                              <ListChecks className="h-4 w-4" />
                              <span className="text-xs font-semibold uppercase tracking-wide">Recommended focus</span>
                            </div>
                            <ul className="space-y-1 text-muted-foreground">
                              {recommendations.map((recommendation) => (
                                <li key={recommendation} className="leading-snug">• {recommendation}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        <p className="text-sm text-muted-foreground leading-relaxed">{segment.description}</p>
                      </div>
                    </div>
                  </div>
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
