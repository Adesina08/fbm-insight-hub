export const DEFAULT_FIELD_MAP = {
  motivation: "motivation_score",
  ability: "ability_score",
  descriptiveNorms: "descriptive_norms",
  injunctiveNorms: "injunctive_norms",
  systemReadiness: "system_score",
  currentUse: "current_use",
  promptFacilitator: "prompt_facilitator",
  promptSpark: "prompt_spark",
  promptSignal: "prompt_signal",
} as const;

export type FieldKey = keyof typeof DEFAULT_FIELD_MAP;

export type FieldMap = Record<FieldKey, string>;

type NormalizedRecord = Map<string, unknown>;

function normalizeKeyName(key: string | undefined): string {
  if (!key) return "";
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildNormalizedRecord(source: RawSubmission): NormalizedRecord {
  const normalized = new Map<string, unknown>();

  Object.entries(source).forEach(([rawKey, value]) => {
    if (typeof rawKey !== "string") {
      return;
    }

    const key = normalizeKeyName(rawKey);
    if (!key || normalized.has(key)) {
      return;
    }

    normalized.set(key, value);
  });

  return normalized;
}

function findMatchingKey(record: NormalizedRecord, tokens: readonly string[]): string | undefined {
  const normalizedTokens = tokens
    .map((token) => normalizeKeyName(token))
    .filter((token) => token.length > 0);

  if (normalizedTokens.length === 0) {
    return undefined;
  }

  for (const key of record.keys()) {
    const keyTokens = key.split("_").filter(Boolean);
    if (normalizedTokens.every((token) => keyTokens.includes(token))) {
      return key;
    }
  }

  return undefined;
}

function lookupFieldValue(record: NormalizedRecord, field: FieldKey, fieldMap: FieldMap): unknown {
  const primaryKey = normalizeKeyName(fieldMap[field]);

  if (primaryKey && record.has(primaryKey)) {
    return record.get(primaryKey);
  }

  const hints = FIELD_TOKEN_HINTS[field] ?? [];
  for (const tokens of hints) {
    const match = findMatchingKey(record, tokens);
    if (match && record.has(match)) {
      return record.get(match);
    }
  }

  return undefined;
}

const FIELD_TOKEN_HINTS: Record<FieldKey, string[][]> = {
  motivation: [
    ["motivation", "score"],
    ["motivation"],
  ],
  ability: [
    ["ability", "score"],
    ["ability"],
  ],
  descriptiveNorms: [
    ["descriptive", "norm"],
    ["descriptive"],
  ],
  injunctiveNorms: [
    ["injunctive", "norm"],
    ["injunctive"],
  ],
  systemReadiness: [
    ["system", "readiness"],
    ["service", "readiness"],
    ["system", "score"],
    ["service", "score"],
  ],
  currentUse: [
    ["current", "use"],
    ["current", "user"],
    ["currently", "using"],
    ["current"],
  ],
  promptFacilitator: [
    ["prompt", "facilitator"],
    ["facilitator", "prompt"],
    ["facilitator"],
  ],
  promptSpark: [
    ["prompt", "spark"],
    ["spark", "prompt"],
    ["spark"],
  ],
  promptSignal: [
    ["prompt", "signal"],
    ["signal", "prompt"],
    ["signal"],
  ],
} as const;

export type QuadrantId =
  | "high_m_high_a"
  | "high_m_low_a"
  | "low_m_high_a"
  | "low_m_low_a";

export interface AnalyticsSubmission {
  id: string;
  motivation: number | null;
  ability: number | null;
  descriptiveNorms: number | null;
  injunctiveNorms: number | null;
  systemReadiness: number | null;
  promptFacilitator: number | null;
  promptSpark: number | null;
  promptSignal: number | null;
  currentUse: boolean | null;
  submissionTime?: string;
  quadrant?: QuadrantId;
}

export interface StatWithChange {
  value: number | null;
  change: number | null;
}

export interface CountWithChange {
  value: number;
  change: number | null;
}

export interface QuadrantInsight {
  id: QuadrantId;
  label: string;
  percentage: number;
  count: number;
  description: string;
  color: string;
  barColor: string;
  currentUseRate: number | null;
  avgMotivation: number | null;
  avgAbility: number | null;
}

export interface ScatterPoint {
  id: string;
  ability: number;
  motivation: number;
  currentUse: boolean;
  norms: number | null;
  system: number | null;
}

export interface SegmentSummary {
  id: QuadrantId;
  name: string;
  percentage: number;
  count: number;
  color: string;
  description: string;
  characteristics: Record<string, number | null>;
  insights: string[];
  recommendations: string[];
  currentUseRate: number | null;
}

export interface PromptEffectivenessRow {
  id: QuadrantId;
  name: string;
  facilitator: number | null;
  spark: number | null;
  signal: number | null;
}

export type RegressionStrength = "strong" | "moderate" | "weak" | "indirect";

export interface RegressionInsight {
  variable: string;
  beta: number | null;
  pValue: string;
  strength: RegressionStrength;
  interpretation: string;
}

export interface ModelSummary {
  label: string;
  value: string;
  helper: string;
}

export interface DashboardAnalytics {
  lastUpdated?: string;
  stats: {
    totalRespondents: CountWithChange;
    currentUsers: CountWithChange;
    averageMotivation: StatWithChange;
    averageAbility: StatWithChange;
  };
  quadrants: QuadrantInsight[];
  scatter: ScatterPoint[];
  segments: SegmentSummary[];
  promptEffectiveness: PromptEffectivenessRow[];
  regression: RegressionInsight[];
  modelSummary: ModelSummary[];
}

export interface RawSubmission extends Record<string, unknown> {
  _id?: string | number;
  _uuid?: string;
  _submission_time?: string;
  end?: string;
  start?: string;
}

const quadrantDetails: Record<QuadrantId, {
  label: string;
  color: string;
  barColor: string;
  name: string;
  description: (metrics: { percentage: number; currentUseRate: number | null }) => string;
  recommendations: string[];
}> = {
  high_m_high_a: {
    label: "High Motivation / High Ability",
    color: "border-quadrant-high-m-high-a bg-quadrant-high-m-high-a/5",
    barColor: "bg-quadrant-high-m-high-a",
    name: "Empowered Adopters",
    description: ({ percentage, currentUseRate }) =>
      `${percentage.toFixed(0)}% of respondents score high on both motivation and ability. Current use rate is ${formatRate(currentUseRate)}.`,
    recommendations: [
      "Keep reinforcing positive habits with timely signal prompts.",
      "Invite participants to champion peer learning and share testimonials.",
      "Use light-touch interventions (reminders, check-ins) to sustain momentum.",
    ],
  },
  high_m_low_a: {
    label: "High Motivation / Low Ability",
    color: "border-quadrant-high-m-low-a bg-quadrant-high-m-low-a/5",
    barColor: "bg-quadrant-high-m-low-a",
    name: "Willing but Hindered",
    description: ({ percentage, currentUseRate }) =>
      `${percentage.toFixed(0)}% of respondents want to act but face barriers. Current use rate is ${formatRate(currentUseRate)}.`,
    recommendations: [
      "Prioritise facilitator prompts that remove logistical and cost barriers.",
      "Strengthen service readiness in low-performing locations.",
      "Provide targeted counselling to convert motivation into action.",
    ],
  },
  low_m_high_a: {
    label: "Low Motivation / High Ability",
    color: "border-quadrant-low-m-high-a bg-quadrant-low-m-high-a/5",
    barColor: "bg-quadrant-low-m-high-a",
    name: "Passive Resisters",
    description: ({ percentage, currentUseRate }) =>
      `${percentage.toFixed(0)}% have access but low motivation. Current use rate is ${formatRate(currentUseRate)}.`,
    recommendations: [
      "Deploy spark prompts that reframe benefits and address hesitancy.",
      "Showcase social proof and positive descriptive norms.",
      "Pair counselling with motivational storytelling.",
    ],
  },
  low_m_low_a: {
    label: "Low Motivation / Low Ability",
    color: "border-quadrant-low-m-low-a bg-quadrant-low-m-low-a/5",
    barColor: "bg-quadrant-low-m-low-a",
    name: "Isolated Non-Users",
    description: ({ percentage, currentUseRate }) =>
      `${percentage.toFixed(0)}% face both motivation and ability gaps. Current use rate is ${formatRate(currentUseRate)}.`,
    recommendations: [
      "Co-design multi-layer interventions with community actors.",
      "Invest in foundational access improvements (mobile outreach, subsidies).",
      "Integrate long-term norm change with system upgrades.",
    ],
  },
};

export function resolveFieldMap(overrides?: Partial<FieldMap>): FieldMap {
  const map = { ...DEFAULT_FIELD_MAP } as Record<FieldKey, string>;

  const envVars = import.meta.env as Record<string, string | undefined> | undefined;

  (Object.keys(map) as FieldKey[]).forEach((key) => {
    const envKey = `VITE_SHEETS_FIELD_${key.toUpperCase()}`;
    const override = envVars?.[envKey];
    if (override && typeof override === "string" && override.trim().length > 0) {
      map[key] = override.trim();
    }
  });

  if (overrides) {
    (Object.keys(overrides) as FieldKey[]).forEach((key) => {
      const value = overrides[key];
      if (value && value.trim().length > 0) {
        map[key] = value.trim();
      }
    });
  }

  return map as FieldMap;
}

export function normalizeSubmissions(
  raw: RawSubmission[],
  fieldMap: FieldMap = resolveFieldMap(),
): AnalyticsSubmission[] {
  return raw.map((item) => {
    const normalizedRecord = buildNormalizedRecord(item);

    const motivation = parseNumber(lookupFieldValue(normalizedRecord, "motivation", fieldMap));
    const ability = parseNumber(lookupFieldValue(normalizedRecord, "ability", fieldMap));
    const descriptiveNorms = parseNumber(lookupFieldValue(normalizedRecord, "descriptiveNorms", fieldMap));
    const injunctiveNorms = parseNumber(lookupFieldValue(normalizedRecord, "injunctiveNorms", fieldMap));
    const systemReadiness = parseNumber(lookupFieldValue(normalizedRecord, "systemReadiness", fieldMap));
    const currentUse = parseBoolean(lookupFieldValue(normalizedRecord, "currentUse", fieldMap));
    const promptFacilitator = parseNumber(lookupFieldValue(normalizedRecord, "promptFacilitator", fieldMap));
    const promptSpark = parseNumber(lookupFieldValue(normalizedRecord, "promptSpark", fieldMap));
    const promptSignal = parseNumber(lookupFieldValue(normalizedRecord, "promptSignal", fieldMap));

    const submissionTime = toISODate(
      typeof item._submission_time === "string"
        ? item._submission_time
        : typeof item.end === "string"
          ? item.end
          : typeof item.start === "string"
            ? item.start
            : undefined,
    );

    const generatedId = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

    const normalized: AnalyticsSubmission = {
      id: String(item._id ?? item._uuid ?? generatedId),
      motivation,
      ability,
      descriptiveNorms,
      injunctiveNorms,
      systemReadiness,
      currentUse,
      promptFacilitator,
      promptSpark,
      promptSignal,
      submissionTime,
    };

    normalized.quadrant = computeQuadrant(normalized.motivation, normalized.ability);

    return normalized;
  });
}

export function buildAnalytics(raw: RawSubmission[], fieldMap?: FieldMap): DashboardAnalytics {
  const submissions = normalizeSubmissions(raw, fieldMap ?? resolveFieldMap());
  return buildAnalyticsFromSubmissions(submissions);
}

export function buildAnalyticsFromSubmissions(submissions: AnalyticsSubmission[]): DashboardAnalytics {
  const total = submissions.length;
  const lastUpdated = submissions.reduce<string | undefined>((latest, submission) => {
    if (!submission.submissionTime) return latest;
    if (!latest) return submission.submissionTime;
    return submission.submissionTime > latest ? submission.submissionTime : latest;
  }, undefined);

  const currentUsers = submissions.filter((submission) => submission.currentUse === true);
  const nonUsers = submissions.filter((submission) => submission.currentUse === false);

  const quadrantGroups: Record<QuadrantId, AnalyticsSubmission[]> = {
    high_m_high_a: [],
    high_m_low_a: [],
    low_m_high_a: [],
    low_m_low_a: [],
  };

  submissions.forEach((submission) => {
    if (submission.quadrant) {
      quadrantGroups[submission.quadrant].push(submission);
    }
  });

  const totalWithQuadrant = Object.values(quadrantGroups).reduce((acc, group) => acc + group.length, 0) || 1;

  const quadrants: QuadrantInsight[] = (Object.keys(quadrantGroups) as QuadrantId[]).map((quadrantId) => {
    const group = quadrantGroups[quadrantId];
    const meta = quadrantDetails[quadrantId];
    const percentage = group.length === 0 ? 0 : (group.length / totalWithQuadrant) * 100;
    const currentUseRate = computeCurrentUseRate(group);
    return {
      id: quadrantId,
      label: meta.label,
      percentage,
      count: group.length,
      description: meta.description({ percentage, currentUseRate }),
      color: meta.color,
      barColor: meta.barColor,
      currentUseRate,
      avgMotivation: average(group.map((item) => item.motivation)),
      avgAbility: average(group.map((item) => item.ability)),
    };
  });

  const scatter: ScatterPoint[] = submissions
    .filter((submission) => submission.ability != null && submission.motivation != null && submission.currentUse != null)
    .map((submission) => ({
      id: submission.id,
      ability: submission.ability ?? 0,
      motivation: submission.motivation ?? 0,
      currentUse: submission.currentUse ?? false,
      norms: average([
        submission.descriptiveNorms,
        submission.injunctiveNorms,
      ]),
      system: submission.systemReadiness,
    }));

  const segments: SegmentSummary[] = (Object.keys(quadrantGroups) as QuadrantId[]).map((quadrantId) => {
    const group = quadrantGroups[quadrantId];
    const meta = quadrantDetails[quadrantId];
    const percentage = total === 0 ? 0 : (group.length / total) * 100;
    const avgPrompt = average(group.map((item) => computePromptReceptivity(item)));
    const currentUseRate = computeCurrentUseRate(group);

    const insights = [
      `${group.length} respondents (${percentage.toFixed(1)}%) fall in this segment.`,
      `Average motivation score: ${formatNullableMetric(average(group.map((item) => item.motivation)))}.`,
      `Average ability score: ${formatNullableMetric(average(group.map((item) => item.ability)))}.`,
      `Current use rate: ${formatRate(currentUseRate)}.`,
    ];

    return {
      id: quadrantId,
      name: meta.name,
      percentage,
      count: group.length,
      color: `quadrant-${quadrantId.replace(/_/g, '-')}`,
      description: meta.description({ percentage, currentUseRate }),
      characteristics: {
        motivation: average(group.map((item) => item.motivation)),
        ability: average(group.map((item) => item.ability)),
        descriptiveNorms: average(group.map((item) => item.descriptiveNorms)),
        injunctiveNorms: average(group.map((item) => item.injunctiveNorms)),
        systemReadiness: average(group.map((item) => item.systemReadiness)),
        promptReceptivity: avgPrompt,
      },
      insights,
      recommendations: meta.recommendations,
      currentUseRate,
    };
  });

  const promptEffectiveness: PromptEffectivenessRow[] = (Object.keys(quadrantGroups) as QuadrantId[]).map((quadrantId) => {
    const group = quadrantGroups[quadrantId];
    const meta = quadrantDetails[quadrantId];
    return {
      id: quadrantId,
      name: meta.name,
      facilitator: computePromptAverage(group, (item) => item.promptFacilitator),
      spark: computePromptAverage(group, (item) => item.promptSpark),
      signal: computePromptAverage(group, (item) => item.promptSignal),
    };
  });

  const predictors = [
    { key: "descriptiveNorms", label: "Descriptive Norms" },
    { key: "injunctiveNorms", label: "Injunctive Norms" },
    { key: "systemReadiness", label: "System Score" },
    { key: "ability", label: "Ability Score" },
    { key: "motivation", label: "Motivation Score" },
    { key: "promptFacilitator", label: "Facilitator Prompts" },
    { key: "promptSpark", label: "Spark Prompts" },
    { key: "promptSignal", label: "Signal Prompts" },
  ] as const;

  const regression: RegressionInsight[] = predictors.map(({ key, label }) => {
    const userAverage = averageFor(currentUsers, (item) => item[key]);
    const nonUserAverage = averageFor(nonUsers, (item) => item[key]);
    const beta = difference(userAverage, nonUserAverage);
    return {
      variable: label,
      beta,
      pValue: computePValue(beta),
      strength: computeStrength(beta),
      interpretation: interpretDifference(label, beta, userAverage, nonUserAverage),
    };
  });

  const { earlier, recent } = splitPeriods(submissions);
  const totalChange = earlier.length > 0 ? computeChange(recent.length, earlier.length) : null;

  const earlierCurrentUseRate = computeCurrentUseRate(earlier);
  const recentCurrentUseRate = computeCurrentUseRate(recent);
  const currentUseChange = (recentCurrentUseRate != null && earlierCurrentUseRate != null)
    ? difference(recentCurrentUseRate, earlierCurrentUseRate)
    : null;

  const earlierMotivation = average(earlier.map((item) => item.motivation));
  const recentMotivation = average(recent.map((item) => item.motivation));
  const motivationChange = difference(recentMotivation, earlierMotivation);

  const earlierAbility = average(earlier.map((item) => item.ability));
  const recentAbility = average(recent.map((item) => item.ability));
  const abilityChange = difference(recentAbility, earlierAbility);

  const stats = {
    totalRespondents: {
      value: total,
      change: totalChange,
    },
    currentUsers: {
      value: currentUsers.length,
      change: currentUseChange == null ? null : currentUseChange * 100,
    },
    averageMotivation: {
      value: average(submissions.map((item) => item.motivation)),
      change: motivationChange,
    },
    averageAbility: {
      value: average(submissions.map((item) => item.ability)),
      change: abilityChange,
    },
  } satisfies DashboardAnalytics["stats"];

  return {
    lastUpdated,
    stats,
    quadrants,
    scatter,
    segments,
    promptEffectiveness,
    regression,
    modelSummary: computeModelSummary(submissions, quadrants),
  };
}

function parseNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1 || value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["yes", "true", "1", "y"].includes(normalized)) return true;
    if (["no", "false", "0", "n"].includes(normalized)) return false;
  }
  return null;
}

function toISODate(value?: string): string | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return undefined;
  return new Date(timestamp).toISOString();
}

function computeQuadrant(motivation: number | null, ability: number | null): QuadrantId | undefined {
  if (motivation == null || ability == null) return undefined;
  const motivationHigh = motivation >= 3;
  const abilityHigh = ability >= 3;

  if (motivationHigh && abilityHigh) return "high_m_high_a";
  if (motivationHigh && !abilityHigh) return "high_m_low_a";
  if (!motivationHigh && abilityHigh) return "low_m_high_a";
  return "low_m_low_a";
}

function average(values: Array<number | null>): number | null {
  const filtered = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (filtered.length === 0) return null;
  const sum = filtered.reduce((acc, value) => acc + value, 0);
  return sum / filtered.length;
}

function formatRate(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "n/a";
  return `${(value * 100).toFixed(0)}%`;
}

function computeChange(newValue: number, oldValue: number): number | null {
  if (!Number.isFinite(oldValue) || oldValue === 0) return null;
  return ((newValue - oldValue) / oldValue) * 100;
}

function difference(newValue: number | null, oldValue: number | null): number | null {
  if (newValue == null || oldValue == null) return null;
  return newValue - oldValue;
}

interface PeriodSplit {
  earlier: AnalyticsSubmission[];
  recent: AnalyticsSubmission[];
}

function splitPeriods(submissions: AnalyticsSubmission[]): PeriodSplit {
  const dated = submissions
    .filter((submission) => submission.submissionTime)
    .sort((a, b) => {
      const aTime = submissionTimeToNumber(a.submissionTime);
      const bTime = submissionTimeToNumber(b.submissionTime);
      return aTime - bTime;
    });

  if (dated.length < 4) {
    return { earlier: [], recent: [] };
  }

  const midpoint = Math.floor(dated.length / 2);
  return {
    earlier: dated.slice(0, midpoint),
    recent: dated.slice(midpoint),
  };
}

function submissionTimeToNumber(value?: string): number {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function computeCurrentUseRate(submissions: AnalyticsSubmission[]): number | null {
  const withFlag = submissions.filter((item) => item.currentUse != null);
  if (withFlag.length === 0) return null;
  const count = withFlag.filter((item) => item.currentUse === true).length;
  return count / withFlag.length;
}

function averageFor(
  submissions: AnalyticsSubmission[],
  selector: (submission: AnalyticsSubmission) => number | null,
): number | null {
  return average(submissions.map(selector));
}

function computePromptAverage(
  submissions: AnalyticsSubmission[],
  selector: (submission: AnalyticsSubmission) => number | null,
): number | null {
  return average(submissions.map(selector));
}

function computePromptReceptivity(submission: AnalyticsSubmission): number | null {
  return average([
    submission.promptFacilitator,
    submission.promptSpark,
    submission.promptSignal,
  ]);
}

function computeStrength(beta: number | null): RegressionStrength {
  if (beta == null || Number.isNaN(beta)) return "indirect";
  const absValue = Math.abs(beta);
  if (absValue >= 1) return "strong";
  if (absValue >= 0.6) return "moderate";
  if (absValue >= 0.3) return "weak";
  return "indirect";
}

function computePValue(beta: number | null): string {
  if (beta == null || Number.isNaN(beta)) return "n/a";
  const absValue = Math.abs(beta);
  if (absValue >= 1) return "<0.01";
  if (absValue >= 0.6) return "<0.05";
  if (absValue >= 0.3) return "<0.10";
  return "n.s.";
}

function interpretDifference(
  label: string,
  beta: number | null,
  userAverage: number | null,
  nonUserAverage: number | null,
): string {
  if (beta == null || userAverage == null || nonUserAverage == null) {
    return `${label} has limited data to calculate a difference.`;
  }

  if (beta > 0) {
    return `${label} is higher among current users (${userAverage.toFixed(2)} vs ${nonUserAverage.toFixed(2)}).`;
  }

  if (beta < 0) {
    return `${label} is lower among current users (${userAverage.toFixed(2)} vs ${nonUserAverage.toFixed(2)}).`;
  }

  return `${label} shows no difference between current users and non-users.`;
}

function computeModelSummary(
  submissions: AnalyticsSubmission[],
  quadrants: QuadrantInsight[],
): ModelSummary[] {
  const total = submissions.length;
  const currentUseRate = computeCurrentUseRate(submissions);
  const avgNorms = average(submissions.map((item) => item.descriptiveNorms));
  const avgSystem = average(submissions.map((item) => item.systemReadiness));
  const dominantQuadrant = [...quadrants].sort((a, b) => b.count - a.count)[0];

  return [
    {
      label: "Current Use Rate",
      value: formatRate(currentUseRate),
      helper: currentUseRate == null
        ? "Current use was not captured in the submissions."
        : `${Math.round(currentUseRate * total)} of ${total} submissions report current use.`,
    },
    {
      label: "Avg Descriptive Norms",
      value: avgNorms == null ? "n/a" : avgNorms.toFixed(2),
      helper: "On a 1-5 scale",
    },
    {
      label: "Avg System Readiness",
      value: avgSystem == null ? "n/a" : avgSystem.toFixed(2),
      helper: "On a 1-5 scale",
    },
    {
      label: "Largest Segment",
      value: dominantQuadrant ? dominantQuadrant.label : "n/a",
      helper: dominantQuadrant
        ? `${dominantQuadrant.count} respondents (${dominantQuadrant.percentage.toFixed(0)}%)`
        : "Not enough data",
    },
  ];
}

function formatNullableMetric(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "n/a";
  return value.toFixed(2);
}

