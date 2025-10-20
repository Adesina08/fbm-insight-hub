import { Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SegmentSummary } from "@/lib/googleSheets";

interface SegmentProfilesProps {
  segments?: SegmentSummary[];
  isLoading?: boolean;
  error?: string | null;
}

type SegmentProfile = {
  name: string;
  color: string;
  values: Record<string, number>;
};

const METRICS = ["Motivation", "Ability", "Norms", "System"] as const;

const SEGMENT_PROFILES: SegmentProfile[] = [
  {
    name: "Empowered Adopters",
    color: "#22c55e",
    values: { Motivation: 4.5, Ability: 4.0, Norms: 4.2, System: 3.8 },
  },
  {
    name: "Willing but Hindered",
    color: "#f59e0b",
    values: { Motivation: 3.0, Ability: 2.2, Norms: 3.5, System: 1.8 },
  },
  {
    name: "Passive Resisters",
    color: "#3b82f6",
    values: { Motivation: 2.2, Ability: 2.8, Norms: 2.0, System: 2.5 },
  },
  {
    name: "Isolated Non-Users",
    color: "#ef4444",
    values: { Motivation: 1.5, Ability: 1.8, Norms: 1.6, System: 1.2 },
  },
];

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

const RadarChart = ({ profile }: { profile: SegmentProfile }) => {
  const size = 240;
  const center = size / 2;
  const radius = size / 2 - 24;
  const angleStep = 360 / METRICS.length;

  const points = METRICS.map((metric, index) => {
    const { x, y } = polarToCartesian(index * angleStep, profile.values[metric], radius, center);
    return `${x},${y}`;
  }).join(" ");

  const gridRadii = [1, 2, 3, 4, 5];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full" role="img" aria-label={`${profile.name} radar chart`}>
      <defs>
        <linearGradient id={`radar-fill-${profile.name.replace(/\s+/g, "-")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={profile.color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={profile.color} stopOpacity="0.15" />
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
      <polygon points={points} fill={`url(#radar-fill-${profile.name.replace(/\s+/g, "-")})`} stroke={profile.color} strokeWidth={3} />
      {METRICS.map((metric, index) => {
        const { x, y } = polarToCartesian(index * angleStep, profile.values[metric], radius, center);
        return <circle key={metric} cx={x} cy={y} r={5} fill={profile.color} stroke="#fff" strokeWidth={1.5} />;
      })}
    </svg>
  );
};

const SegmentProfiles = ({ isLoading = false, error }: SegmentProfilesProps) => {
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
                Radar charts replicating the provided segment profiles, including the system dimension
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            {SEGMENT_PROFILES.map((profile) => (
              <div key={profile.name} className="space-y-4">
                <h3 className="text-lg font-semibold text-center text-foreground">{profile.name}</h3>
                <div className="rounded-2xl border bg-background/70 p-4 shadow-inner">
                  <RadarChart profile={profile} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            These static profiles mirror the attached reference, offering a quick comparison of motivation, ability, norms, and
            system readiness across all four behavioural segments.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SegmentProfiles;
