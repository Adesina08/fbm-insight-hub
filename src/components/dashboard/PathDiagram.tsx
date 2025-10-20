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

const LoadingState = () => (
  <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
    <CardHeader>
      <Skeleton className="h-6 w-60" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
);

const PathDiagram = ({ isLoading = false, error }: PathDiagramProps) => {
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
              Path diagram recreating the attached system factor illustration
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border bg-background/70 p-4 shadow-inner">
          <svg viewBox="0 0 760 460" className="w-full h-full" role="img" aria-labelledby="path-diagram-title">
            <title id="path-diagram-title">
              Path diagram illustrating relationships between prompts, motivation, ability, norms, system, and contraceptive use
            </title>
            <text x="360" y="36" textAnchor="middle" fontSize="22" fontWeight="600" fill="var(--foreground)">
              Path Diagram: Predictors of Contraceptive Use (Including System Factor)
            </text>
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" fill="#4b5563">
                <path d="M0,0 L10,5 L0,10 z" />
              </marker>
            </defs>
            <g fontSize="15" fontWeight="600" fill="#1f2937">
              <rect x="110" y="150" width="140" height="140" rx="70" fill="#d7ecf7" stroke="#5b8db6" strokeWidth="3" />
              <text x="180" y="230" textAnchor="middle">
                Prompts
              </text>
              <rect x="320" y="80" width="150" height="100" rx="50" fill="#d7ecf7" stroke="#5b8db6" strokeWidth="3" />
              <text x="395" y="140" textAnchor="middle">
                Motivation
              </text>
              <rect x="320" y="180" width="150" height="100" rx="50" fill="#d7ecf7" stroke="#5b8db6" strokeWidth="3" />
              <text x="395" y="240" textAnchor="middle">
                Ability
              </text>
              <rect x="320" y="260" width="150" height="100" rx="50" fill="#d7ecf7" stroke="#5b8db6" strokeWidth="3" />
              <text x="395" y="320" textAnchor="middle">
                Norms
              </text>
              <rect x="320" y="340" width="150" height="100" rx="50" fill="#d7ecf7" stroke="#5b8db6" strokeWidth="3" />
              <text x="395" y="400" textAnchor="middle">
                System
              </text>
              <rect x="560" y="190" width="180" height="140" rx="70" fill="#b0d4eb" stroke="#366891" strokeWidth="3" />
              <text x="650" y="260" textAnchor="middle">
                Contraceptive
              </text>
              <text x="650" y="284" textAnchor="middle">
                Use
              </text>
            </g>
            <g stroke="#4b5563" strokeWidth="2" markerEnd="url(#arrow)" fill="none" fontSize="14" fontWeight="600">
              <path d="M250 220 C 290 220, 320 140, 320 140" />
              <text x="300" y="170" fill="#374151">β=0.5</text>

              <path d="M250 220 C 290 220, 320 320, 320 320" />
              <text x="300" y="300" fill="#374151">β=0.4</text>

              <line x1="470" y1="130" x2="560" y2="230" />
              <text x="505" y="150" fill="#374151">β=0.6</text>

              <line x1="470" y1="230" x2="560" y2="240" />
              <text x="505" y="215" fill="#374151">β=1.2</text>

              <line x1="470" y1="310" x2="560" y2="260" />
              <text x="505" y="285" fill="#374151">β=1.8</text>

              <line x1="470" y1="390" x2="560" y2="280" />
              <text x="505" y="360" fill="#374151">β=1.5</text>
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default PathDiagram;
