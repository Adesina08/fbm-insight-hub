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

const average = (values: Array<number | null | undefined>): number | null => {
  const valid = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (valid.length === 0) {
    return null;
  }
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

const formatBeta = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) {
    return "n/a";
  }
  const rounded = Math.abs(value) >= 1 ? value.toFixed(2) : value.toFixed(2);
  return `${value > 0 ? "+" : ""}${rounded}`;
};

const formatEdgeLabel = (beta: number | null | undefined, pValue?: string) => {
  if (beta == null || Number.isNaN(beta)) {
    return "β = n/a";
  }
  const pLabel = pValue && pValue.length > 0 ? pValue : "n/a";
  return `β = ${formatBeta(beta)} (p = ${pLabel})`;
};

const findInsight = (regression: RegressionInsight[] | undefined, variable: string) =>
  regression?.find((item) => item.variable === variable);

const PathDiagram = ({ regression, summary, isLoading = false, error }: PathDiagramProps) => {
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

  if (!regression || regression.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">No regression signals available</CardTitle>
          <CardDescription>
            Include motivation, ability, norms, system, and prompt fields in the sheet to generate the predictor diagram.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const motivationInsight = findInsight(regression, "Motivation Score");
  const abilityInsight = findInsight(regression, "Ability Score");
  const systemInsight = findInsight(regression, "System Score");
  const descriptiveInsight = findInsight(regression, "Descriptive Norms");
  const injunctiveInsight = findInsight(regression, "Injunctive Norms");
  const facilitatorInsight = findInsight(regression, "Facilitator Prompts");
  const sparkInsight = findInsight(regression, "Spark Prompts");
  const signalInsight = findInsight(regression, "Signal Prompts");

  const normsBeta = average([descriptiveInsight?.beta ?? null, injunctiveInsight?.beta ?? null]);
  const dominantNorm = [descriptiveInsight, injunctiveInsight]
    .filter((item): item is RegressionInsight => !!item && item.beta != null && Number.isFinite(item.beta))
    .sort((a, b) => Math.abs((b.beta ?? 0)) - Math.abs((a.beta ?? 0)))[0];

  const promptsAverage = average([
    facilitatorInsight?.beta ?? null,
    sparkInsight?.beta ?? null,
    signalInsight?.beta ?? null,
  ]);

  const regressionByStrength = [...regression].sort((a, b) => Math.abs((b.beta ?? 0)) - Math.abs((a.beta ?? 0)));

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
              Dynamic path diagram using derived betas from Google Sheets submissions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border bg-background/70 p-4 shadow-inner">
            <svg viewBox="0 0 760 460" className="w-full h-full" role="img" aria-labelledby="path-diagram-title">
              <title id="path-diagram-title">
                Path diagram illustrating the derived relationships between prompts, psychosocial drivers, and contraceptive use
              </title>
              <text x="360" y="36" textAnchor="middle" fontSize="22" fontWeight="600" fill="var(--foreground)">
                Path Diagram: Predictors of Contraceptive Use
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
                <rect x="320" y="280" width="150" height="100" rx="50" fill="#d7ecf7" stroke="#5b8db6" strokeWidth="3" />
                <text x="395" y="340" textAnchor="middle">
                  Norms
                </text>
                <rect x="320" y="360" width="150" height="100" rx="50" fill="#d7ecf7" stroke="#5b8db6" strokeWidth="3" />
                <text x="395" y="420" textAnchor="middle">
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
                <text x="300" y="170" fill="#374151">
                  {formatEdgeLabel(sparkInsight?.beta ?? promptsAverage, sparkInsight?.pValue)}
                </text>

                <path d="M250 220 C 290 220, 320 320, 320 320" />
                <text x="300" y="300" fill="#374151">
                  {formatEdgeLabel(signalInsight?.beta ?? promptsAverage, signalInsight?.pValue)}
                </text>

                <line x1="470" y1="130" x2="560" y2="230" />
                <text x="505" y="150" fill="#374151">
                  {formatEdgeLabel(motivationInsight?.beta, motivationInsight?.pValue)}
                </text>

                <line x1="470" y1="230" x2="560" y2="240" />
                <text x="505" y="215" fill="#374151">
                  {formatEdgeLabel(abilityInsight?.beta, abilityInsight?.pValue)}
                </text>

                <line x1="470" y1="310" x2="560" y2="260" />
                <text x="505" y="285" fill="#374151" title={`Descriptive: ${formatBeta(descriptiveInsight?.beta)} · Injunctive: ${formatBeta(injunctiveInsight?.beta)}`}>
                  {formatEdgeLabel(normsBeta, dominantNorm?.pValue)}
                </text>

                <line x1="470" y1="390" x2="560" y2="280" />
                <text x="505" y="360" fill="#374151">
                  {formatEdgeLabel(systemInsight?.beta, systemInsight?.pValue)}
                </text>
              </g>
            </svg>
          </div>
          <div className="space-y-6">
            {summary && summary.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Model summary</h3>
                <dl className="grid gap-3">
                  {summary.map((item) => (
                    <div key={item.label} className="rounded-lg border bg-background/70 p-3">
                      <dt className="text-sm font-medium text-muted-foreground">{item.label}</dt>
                      <dd className="text-lg font-semibold text-foreground">{item.value}</dd>
                      <p className="text-xs text-muted-foreground mt-1">{item.helper}</p>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Regression insights</h3>
              <ul className="space-y-3">
                {regressionByStrength.map((insight) => (
                  <li key={insight.variable} className="rounded-lg border bg-background/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{insight.variable}</p>
                        <p className="text-xs text-muted-foreground">Strength: {insight.strength}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">β = {formatBeta(insight.beta)}</p>
                        <p className="text-xs text-muted-foreground">p = {insight.pValue ?? "n/a"}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{insight.interpretation}</p>
                  </li>
                ))}
              </ul>
              {promptsAverage != null ? (
                <p className="text-xs text-muted-foreground">
                  Average prompt beta across facilitator, spark, and signal items: {formatBeta(promptsAverage)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PathDiagram;
