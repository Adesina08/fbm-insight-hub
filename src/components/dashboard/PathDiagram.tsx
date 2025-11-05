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

const median = (values: Array<number | null | undefined>): number | null => {
  const valid = values
    .filter((value): value is number => value != null && Number.isFinite(value))
    .sort((a, b) => a - b);
  if (valid.length === 0) {
    return null;
  }
  const middle = Math.floor(valid.length / 2);
  if (valid.length % 2 === 0) {
    return (valid[middle - 1] + valid[middle]) / 2;
  }
  return valid[middle];
};

const formatBeta = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) {
    return "n/a";
  }
  const rounded = Math.abs(value) >= 1 ? value.toFixed(2) : value.toFixed(2);
  return `${value > 0 ? "+" : ""}${rounded}`;
};

const formatPValue = (value?: string | null) => {
  if (!value || value.length === 0) {
    return "n/a";
  }
  return value;
};

const formatEdgeLabel = (beta: number | null | undefined, pValue?: string | null) => {
  if (beta == null || Number.isNaN(beta)) {
    return "β = n/a";
  }
  const pLabel = formatPValue(pValue);
  return `β = ${formatBeta(beta)} (p = ${pLabel})`;
};

const parsePValueNumber = (value?: string | null): number | null => {
  if (!value) {
    return null;
  }

  const match = value.trim().match(/([0-9]*\.?[0-9]+(?:e-?[0-9]+)?)/i);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

type SignificanceLevel = "high" | "moderate" | "low" | "borderline" | "unknown";

const getSignificanceLevel = (pValue: number | null): SignificanceLevel => {
  if (pValue == null) {
    return "unknown";
  }
  if (pValue < 0.001) {
    return "high";
  }
  if (pValue < 0.01) {
    return "moderate";
  }
  if (pValue < 0.05) {
    return "low";
  }
  if (pValue < 0.1) {
    return "borderline";
  }
  return "unknown";
};

const SIGNIFICANCE_META: Record<SignificanceLevel, { label: string; helper: string; badgeClass: string }> = {
  high: {
    label: "Highly significant",
    helper: "p < 0.001",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  moderate: {
    label: "Strong evidence",
    helper: "p < 0.01",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  low: {
    label: "Statistically significant",
    helper: "p < 0.05",
    badgeClass: "bg-lime-50 text-lime-700 border border-lime-200",
  },
  borderline: {
    label: "Borderline",
    helper: "p < 0.1",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  unknown: {
    label: "Not significant / n/a",
    helper: "p ≥ 0.1 or unavailable",
    badgeClass: "bg-slate-100 text-slate-600 border border-slate-200",
  },
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

  const getEdgeColor = (beta: number | null | undefined) => {
    if (beta == null || Number.isNaN(beta)) {
      return "#9ca3af";
    }
    return beta >= 0 ? "#15803d" : "#dc2626";
  };

  const getStrokeWidth = (beta: number | null | undefined) => {
    if (beta == null || Number.isNaN(beta)) {
      return 2;
    }
    return 2 + Math.min(Math.abs(beta) * 5, 3);
  };

  const getMarkerId = (beta: number | null | undefined) => {
    if (beta == null || Number.isNaN(beta)) {
      return "arrow-neutral";
    }
    return beta >= 0 ? "arrow-positive" : "arrow-negative";
  };

  const promptNodes = {
    spark: { x: 90, y: 120, width: 190, height: 68, title: "Spark prompts", insight: sparkInsight },
    facilitator: {
      x: 90,
      y: 220,
      width: 190,
      height: 68,
      title: "Facilitator prompts",
      insight: facilitatorInsight,
    },
    signal: { x: 90, y: 320, width: 190, height: 68, title: "Signal prompts", insight: signalInsight },
  } as const;

  const driverNodes = {
    motivation: { x: 360, y: 100, width: 210, height: 80, title: "Motivation", insight: motivationInsight },
    ability: { x: 360, y: 215, width: 210, height: 80, title: "Ability", insight: abilityInsight },
    norms: {
      x: 360,
      y: 330,
      width: 210,
      height: 90,
      title: "Norms",
      insight: dominantNorm,
      beta: normsBeta,
    },
    system: { x: 360, y: 440, width: 210, height: 80, title: "System", insight: systemInsight },
  } as const;

  const outcomeNode = {
    x: 680,
    y: 220,
    width: 210,
    height: 140,
    title: "Contraceptive use",
  } as const;

  const promptSummaryNode = {
    x: 90,
    y: 420,
    width: 190,
    height: 80,
    title: "Prompt influence",
  } as const;

  const VIEWBOX = { width: 940, height: 560 } as const;
  const diagramCenterX = VIEWBOX.width / 2;

  type DiagramNode = {
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
  };

  type EdgeDefinition = {
    from: DiagramNode;
    to: DiagramNode;
    beta: number | null | undefined;
    pValue?: string | null;
    labelOffset?: { x: number; y: number };
  };

  const edges: EdgeDefinition[] = [
    {
      from: promptNodes.spark,
      to: driverNodes.motivation,
      beta: sparkInsight?.beta,
      pValue: sparkInsight?.pValue,
      labelOffset: { x: -10, y: -28 },
    },
    {
      from: promptNodes.facilitator,
      to: driverNodes.ability,
      beta: facilitatorInsight?.beta,
      pValue: facilitatorInsight?.pValue,
      labelOffset: { x: -18, y: -10 },
    },
    {
      from: promptNodes.signal,
      to: driverNodes.norms,
      beta: signalInsight?.beta,
      pValue: signalInsight?.pValue,
      labelOffset: { x: -18, y: 28 },
    },
    {
      from: driverNodes.motivation,
      to: outcomeNode,
      beta: motivationInsight?.beta,
      pValue: motivationInsight?.pValue,
      labelOffset: { x: 0, y: -26 },
    },
    {
      from: driverNodes.ability,
      to: outcomeNode,
      beta: abilityInsight?.beta,
      pValue: abilityInsight?.pValue,
      labelOffset: { x: 0, y: -4 },
    },
    {
      from: driverNodes.norms,
      to: outcomeNode,
      beta: normsBeta,
      pValue: dominantNorm?.pValue,
      labelOffset: { x: 0, y: 22 },
    },
    {
      from: driverNodes.system,
      to: outcomeNode,
      beta: systemInsight?.beta,
      pValue: systemInsight?.pValue,
      labelOffset: { x: 0, y: 42 },
    },
  ];

  if (promptsAverage != null && Number.isFinite(promptsAverage)) {
    edges.push({
      from: promptSummaryNode,
      to: outcomeNode,
      beta: promptsAverage,
      pValue: null,
      labelOffset: { x: -20, y: 58 },
    });
  }

  const betaValues = regression.map((insight) => insight.beta ?? null);
  const medianBeta = median(betaValues);

  const sortedPositive = regression
    .filter((insight) => (insight.beta ?? null) != null && Number.isFinite(insight.beta ?? null) && (insight.beta ?? 0) > 0)
    .sort((a, b) => (b.beta ?? 0) - (a.beta ?? 0));

  const sortedNegative = regression
    .filter((insight) => (insight.beta ?? null) != null && Number.isFinite(insight.beta ?? null) && (insight.beta ?? 0) < 0)
    .sort((a, b) => (a.beta ?? 0) - (b.beta ?? 0));

  const strongestPositive = sortedPositive[0] ?? null;
  const strongestNegative = sortedNegative[0] ?? null;

  const totalPredictors = regression.length;

  const significanceTally = regression.reduce(
    (acc, insight) => {
      const numericP = parsePValueNumber(insight.pValue);
      const level = getSignificanceLevel(numericP);
      acc[level] += 1;
      if (numericP != null) {
        acc.reported += 1;
      }
      return acc;
    },
    { high: 0, moderate: 0, low: 0, borderline: 0, unknown: 0, reported: 0 },
  );

  const reportedPredictors = significanceTally.reported;
  const clearlySignificant = significanceTally.high + significanceTally.moderate + significanceTally.low;
  const borderlinePredictors = significanceTally.borderline;
  const shareSignificant = reportedPredictors > 0 ? (clearlySignificant / reportedPredictors) * 100 : null;

  const promptCoverage = [sparkInsight, facilitatorInsight, signalInsight].filter((item) => item != null).length;

  const significanceLevels: SignificanceLevel[] = ["high", "moderate", "low", "borderline", "unknown"];

  const insightHighlights = [
    strongestPositive
      ? `${strongestPositive.variable} shows the strongest positive effect (${formatBeta(strongestPositive.beta)}) on contraceptive use.`
      : null,
    strongestNegative
      ? `${strongestNegative.variable} is the largest friction in the model (${formatBeta(strongestNegative.beta)}).`
      : null,
    promptsAverage != null
      ? `Prompt levers collectively average ${formatBeta(promptsAverage)}, reinforcing the role of communications alongside psychosocial drivers.`
      : null,
    dominantNorm
      ? `${dominantNorm.variable} currently leads the norms construct with ${formatBeta(dominantNorm.beta)}.`
      : null,
    shareSignificant != null
      ? `${shareSignificant.toFixed(0)}% of predictors with reported p-values reach conventional significance (p < 0.05).`
      : null,
    borderlinePredictors > 0
      ? `${borderlinePredictors} predictors sit in the borderline band (0.05 ≤ p < 0.1) and may respond to additional data.`
      : null,
  ].filter((item): item is string => typeof item === "string" && item.length > 0);

  const highlightCards = [
    {
      title: "Predictors analysed",
      value: totalPredictors > 0 ? totalPredictors.toString() : "—",
      helper:
        reportedPredictors > 0
          ? `${reportedPredictors} include significance tests`
          : "Awaiting significance statistics",
      accent: "from-sky-100 via-sky-50 to-blue-100 text-sky-900 border-sky-200",
    },
    {
      title: "Strongest accelerator",
      value: strongestPositive?.variable ?? "Not detected",
      helper: strongestPositive
        ? `β = ${formatBeta(strongestPositive.beta)} · p = ${formatPValue(strongestPositive.pValue)}`
        : "No positive betas yet",
      accent: "from-emerald-100 via-emerald-50 to-teal-100 text-emerald-900 border-emerald-200",
    },
    {
      title: "Strongest friction",
      value: strongestNegative?.variable ?? "Not detected",
      helper: strongestNegative
        ? `β = ${formatBeta(strongestNegative.beta)} · p = ${formatPValue(strongestNegative.pValue)}`
        : "No negative betas yet",
      accent: "from-rose-100 via-rose-50 to-red-100 text-rose-900 border-rose-200",
    },
    {
      title: "Median β",
      value: medianBeta != null ? formatBeta(medianBeta) : "n/a",
      helper:
        shareSignificant != null
          ? `${shareSignificant.toFixed(0)}% significant among tested predictors`
          : "Add p-values to monitor certainty",
      accent: "from-indigo-100 via-indigo-50 to-purple-100 text-indigo-900 border-indigo-200",
    },
  ];

  const promptDetails = [
    { key: "spark", label: "Spark prompts", insight: sparkInsight },
    { key: "facilitator", label: "Facilitator prompts", insight: facilitatorInsight },
    { key: "signal", label: "Signal prompts", insight: signalInsight },
  ] as const;

  const createCurvePath = (
    from: { x: number; y: number; width: number; height: number },
    to: { x: number; y: number; width: number; height: number },
  ) => {
    const startX = from.x + from.width;
    const startY = from.y + from.height / 2;
    const endX = to.x;
    const endY = to.y + to.height / 2;
    const controlX1 = startX + (endX - startX) * 0.35;
    const controlY1 = startY;
    const controlX2 = startX + (endX - startX) * 0.65;
    const controlY2 = endY;
    return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
  };

  const renderNode = (
    node:
      | (typeof promptNodes)[keyof typeof promptNodes]
      | (typeof driverNodes)[keyof typeof driverNodes]
      | typeof outcomeNode
      | typeof promptSummaryNode,
    options?: {
      subtitle?: string;
      helper?: string;
      description?: string;
      variant: "prompt" | "driver" | "outcome" | "summary";
    },
  ) => {
    const { subtitle, helper, description, variant } = options ?? { variant: "driver" };
    const resolvedVariant = variant ?? "driver";
    const centerX = node.x + node.width / 2;
    const titleY = node.y + 26;
    const subtitleY = node.y + node.height / 2 + (description ? -6 : 0);
    const helperY = node.y + node.height - 18;
    const descriptionY = node.y + node.height / 2 + 18;
    const fills = {
      prompt: { fill: "url(#prompt-node)", stroke: "#60a5fa" },
      driver: { fill: "url(#driver-node)", stroke: "#38bdf8" },
      outcome: { fill: "url(#outcome-node)", stroke: "#0f766e" },
      summary: { fill: "url(#summary-node)", stroke: "#a78bfa" },
    } as const;

    return (
      <g>
        <rect
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          rx={node.height / 2.4}
          fill={fills[resolvedVariant].fill}
          stroke={fills[resolvedVariant].stroke}
          strokeWidth={2.4}
          filter="url(#node-shadow)"
        />
        <text x={centerX} y={titleY} textAnchor="middle" fontSize="16" fontWeight="600" fill="#0f172a">
          {node.title}
        </text>
        {subtitle ? (
          <text x={centerX} y={subtitleY} textAnchor="middle" fontSize="13" fontWeight="500" fill="#1f2937">
            {subtitle}
          </text>
        ) : null}
        {description ? (
          <text x={centerX} y={descriptionY} textAnchor="middle" fontSize="12" fill="#334155">
            {description}
          </text>
        ) : null}
        {helper ? (
          <text x={centerX} y={helperY} textAnchor="middle" fontSize="12" fill="#475569">
            {helper}
          </text>
        ) : null}
      </g>
    );
  };

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
              Dynamic path diagram using derived betas from recent submissions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlightCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-2xl border bg-gradient-to-br ${card.accent} p-4 shadow-sm shadow-primary/10`}
            >
              <p className="text-sm font-medium text-slate-600">{card.title}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
              <p className="mt-3 text-xs text-slate-700/80">{card.helper}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border bg-background/70 p-4 shadow-inner">
            <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-white/90 via-background/70 to-white/60 p-3">
              <div className="relative aspect-[47/28] w-full">
                <svg
                  viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
                  className="absolute inset-0 h-full w-full"
                  role="img"
                  aria-labelledby="path-diagram-title"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <title id="path-diagram-title">
                    Path diagram illustrating the derived relationships between prompts, psychosocial drivers, and contraceptive use
                  </title>
                  <defs>
                    <linearGradient id="prompt-node" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#e0f2fe" />
                      <stop offset="100%" stopColor="#bfdbfe" />
                    </linearGradient>
                    <linearGradient id="driver-node" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ecfeff" />
                      <stop offset="100%" stopColor="#bae6fd" />
                    </linearGradient>
                    <linearGradient id="outcome-node" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ccfbf1" />
                      <stop offset="100%" stopColor="#5eead4" />
                    </linearGradient>
                    <linearGradient id="summary-node" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ede9fe" />
                      <stop offset="100%" stopColor="#ddd6fe" />
                    </linearGradient>
                    <linearGradient id="prompt-backdrop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.65" />
                    </linearGradient>
                    <linearGradient id="driver-backdrop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ecfeff" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.55" />
                    </linearGradient>
                    <linearGradient id="outcome-backdrop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f0fdfa" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#ccfbf1" stopOpacity="0.6" />
                    </linearGradient>
                    <radialGradient id="flow-highlight" cx="50%" cy="50%" r="70%">
                      <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" />
                      <stop offset="45%" stopColor="#eff6ff" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
                    </radialGradient>
                    <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.12" />
                    </filter>
                    <marker
                      id="arrow-positive"
                      markerWidth="14"
                      markerHeight="14"
                      refX="12"
                      refY="7"
                      orient="auto"
                      fill="#15803d"
                    >
                      <path d="M0,0 L14,7 L0,14 z" />
                    </marker>
                    <marker
                      id="arrow-negative"
                      markerWidth="14"
                      markerHeight="14"
                      refX="12"
                      refY="7"
                      orient="auto"
                      fill="#dc2626"
                    >
                      <path d="M0,0 L14,7 L0,14 z" />
                    </marker>
                    <marker
                      id="arrow-neutral"
                      markerWidth="14"
                      markerHeight="14"
                      refX="12"
                      refY="7"
                      orient="auto"
                      fill="#6b7280"
                    >
                      <path d="M0,0 L14,7 L0,14 z" />
                    </marker>
                  </defs>
                  <rect x={0} y={0} width={VIEWBOX.width} height={VIEWBOX.height} fill="url(#flow-highlight)" />
                  <g opacity={0.95}>
                    <text x={diagramCenterX} y={40} textAnchor="middle" fontSize="24" fontWeight="700" fill="#0f172a">
                      Predictor pathways for contraceptive use
                    </text>
                    <text x={diagramCenterX} y={66} textAnchor="middle" fontSize="14" fill="#334155">
                      Each arrow communicates the direction and strength of association from prompts to psychosocial drivers to outcomes
                    </text>
                  </g>
                  <g>
                    <rect x="60" y="90" width="250" height="340" rx="32" fill="url(#prompt-backdrop)" stroke="#bfdbfe" strokeWidth="1.6" />
                    <text x="185" y="118" textAnchor="middle" fontSize="15" fontWeight="600" fill="#1e293b">
                      Prompts & nudges
                    </text>
                    {renderNode(promptNodes.spark, {
                      variant: "prompt",
                      subtitle: `β = ${formatBeta(promptNodes.spark.insight?.beta)}`,
                      helper: `p = ${formatPValue(promptNodes.spark.insight?.pValue)}`,
                    })}
                    {renderNode(promptNodes.facilitator, {
                      variant: "prompt",
                      subtitle: `β = ${formatBeta(promptNodes.facilitator.insight?.beta)}`,
                      helper: `p = ${formatPValue(promptNodes.facilitator.insight?.pValue)}`,
                    })}
                    {renderNode(promptNodes.signal, {
                      variant: "prompt",
                      subtitle: `β = ${formatBeta(promptNodes.signal.insight?.beta)}`,
                      helper: `p = ${formatPValue(promptNodes.signal.insight?.pValue)}`,
                    })}
                    {renderNode(promptSummaryNode, {
                      variant: "summary",
                      subtitle: `β̄ = ${formatBeta(promptsAverage)}`,
                      helper: "Average across prompts",
                    })}
                  </g>
                  <g>
                    <rect x="320" y="80" width="280" height="460" rx="38" fill="url(#driver-backdrop)" stroke="#7dd3fc" strokeWidth="1.6" />
                    <text x="460" y="108" textAnchor="middle" fontSize="15" fontWeight="600" fill="#0f172a">
                      Psychosocial drivers
                    </text>
                    {renderNode(driverNodes.motivation, {
                      variant: "driver",
                      subtitle: `β = ${formatBeta(driverNodes.motivation.insight?.beta)}`,
                      helper: `p = ${formatPValue(driverNodes.motivation.insight?.pValue)}`,
                    })}
                    {renderNode(driverNodes.ability, {
                      variant: "driver",
                      subtitle: `β = ${formatBeta(driverNodes.ability.insight?.beta)}`,
                      helper: `p = ${formatPValue(driverNodes.ability.insight?.pValue)}`,
                    })}
                    {renderNode(driverNodes.norms, {
                      variant: "driver",
                      subtitle: `β = ${formatBeta(driverNodes.norms.beta)}`,
                      helper: dominantNorm ? `${dominantNorm.variable}` : "Descriptive & injunctive",
                      description: dominantNorm
                        ? `Stronger: ${formatBeta(dominantNorm.beta)}`
                        : `Descriptive: ${formatBeta(descriptiveInsight?.beta)} · Injunctive: ${formatBeta(injunctiveInsight?.beta)}`,
                    })}
                    {renderNode(driverNodes.system, {
                      variant: "driver",
                      subtitle: `β = ${formatBeta(driverNodes.system.insight?.beta)}`,
                      helper: `p = ${formatPValue(driverNodes.system.insight?.pValue)}`,
                    })}
                  </g>
                  <g>
                    <rect x="610" y="150" width="260" height="260" rx="40" fill="url(#outcome-backdrop)" stroke="#5eead4" strokeWidth="1.6" />
                    <text x="740" y="180" textAnchor="middle" fontSize="15" fontWeight="600" fill="#0f172a">
                      Contraceptive use outcome
                    </text>
                  </g>
                  {renderNode(outcomeNode, {
                    variant: "outcome",
                    subtitle: "Outcome",
                    helper: "Measured as self-reported use",
                  })}
                  <g>
                    {edges.map((edge, index) => {
                      const path = createCurvePath(edge.from, edge.to);
                      const startX = edge.from.x + edge.from.width;
                      const startY = edge.from.y + edge.from.height / 2;
                      const endX = edge.to.x;
                      const endY = edge.to.y + edge.to.height / 2;
                      const labelX = (startX + endX) / 2 + (edge.labelOffset?.x ?? 0);
                      const labelY = (startY + endY) / 2 + (edge.labelOffset?.y ?? 0);

                      return (
                        <g key={index}>
                          <path
                            d={path}
                            stroke={getEdgeColor(edge.beta)}
                            strokeWidth={getStrokeWidth(edge.beta)}
                            fill="none"
                            markerEnd={`url(#${getMarkerId(edge.beta)})`}
                            opacity={edge.beta == null || Number.isNaN(edge.beta) ? 0.55 : 0.92}
                          />
                          <text
                            x={labelX}
                            y={labelY}
                            textAnchor="middle"
                            fontSize="12"
                            fontWeight="500"
                            fill={getEdgeColor(edge.beta)}
                            title={
                              edge.from === driverNodes.norms
                                ? `Descriptive: ${formatBeta(descriptiveInsight?.beta)} · Injunctive: ${formatBeta(injunctiveInsight?.beta)}`
                                : undefined
                            }
                          >
                            {formatEdgeLabel(edge.beta, edge.pValue)}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>
            </div>
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
            {insightHighlights.length > 0 ? (
              <div className="rounded-2xl border bg-background/70 p-4 space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Quick takeaways</h3>
                <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {insightHighlights.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 flex-none rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-background/70 p-5 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Significance breakdown</h3>
            <dl className="space-y-3">
              {significanceLevels.map((level) => (
                <div
                  key={level}
                  className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-muted bg-background/80 px-3 py-2.5"
                >
                  <div>
                    <dt className="text-sm font-medium text-foreground">{SIGNIFICANCE_META[level].label}</dt>
                    <dd className="text-xs text-muted-foreground">{SIGNIFICANCE_META[level].helper}</dd>
                  </div>
                  <span className="text-lg font-semibold text-foreground">
                    {significanceTally[level]}
                  </span>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted-foreground">
              {reportedPredictors > 0
                ? `${shareSignificant?.toFixed(0) ?? 0}% of tested predictors clear the p < 0.05 threshold.`
                : "Provide p-values to unlock significance monitoring."}
            </p>
          </div>
          <div className="rounded-2xl border bg-background/70 p-5 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Prompt coverage</h3>
            <p className="text-sm text-muted-foreground">
              {promptCoverage === promptDetails.length
                ? "All prompt families have regression coefficients."
                : `${promptCoverage} of ${promptDetails.length} prompt families currently have betas.`}
            </p>
            <ul className="space-y-3">
              {promptDetails.map((detail) => {
                const beta = detail.insight?.beta ?? null;
                const numericP = parsePValueNumber(detail.insight?.pValue);
                const level = getSignificanceLevel(numericP);
                return (
                  <li key={detail.key} className="rounded-xl border bg-background/80 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{detail.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {detail.insight?.interpretation ?? "No responses mapped yet."}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-sm font-semibold text-foreground">β = {formatBeta(beta)}</p>
                        <span
                          className={`inline-flex items-center justify-end rounded-full px-2 py-0.5 text-[11px] font-medium ${SIGNIFICANCE_META[level].badgeClass}`}
                        >
                          {detail.insight?.pValue ? `p = ${formatPValue(detail.insight?.pValue)}` : "p-value n/a"}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Regression insights</h3>
          <ul className="space-y-3">
            {regressionByStrength.map((insight) => {
              const numericP = parsePValueNumber(insight.pValue);
              const level = getSignificanceLevel(numericP);
              return (
                <li key={insight.variable} className="rounded-2xl border bg-background/80 p-4 shadow-sm shadow-muted/30">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{insight.variable}</p>
                      <p className="text-xs text-muted-foreground">Strength: {insight.strength}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-base font-semibold text-foreground">β = {formatBeta(insight.beta)}</p>
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${SIGNIFICANCE_META[level].badgeClass}`}
                        >
                          {SIGNIFICANCE_META[level].label}
                        </span>
                        <span className="text-xs text-muted-foreground">p = {insight.pValue ?? "n/a"}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{insight.interpretation}</p>
                </li>
              );
            })}
          </ul>
          {promptsAverage != null ? (
            <p className="text-xs text-muted-foreground">
              Average prompt beta across facilitator, spark, and signal items: {formatBeta(promptsAverage)}
            </p>
          ) : null}
          {borderlinePredictors > 0 ? (
            <p className="text-xs text-muted-foreground">
              {borderlinePredictors} predictors fall into the borderline significance band (0.05 ≤ p &lt; 0.1).
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default PathDiagram;
