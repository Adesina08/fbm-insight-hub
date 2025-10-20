import {
  QUESTIONNAIRE_CHOICE_LOOKUP,
  QUESTIONNAIRE_QUESTION_LOOKUP,
} from "./questionnaire";
import type { QuestionnaireQuestion } from "./questionnaire";

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

const MIN_TOKEN_LENGTH = 3;

function findQuestion(questionId: string): QuestionnaireQuestion | undefined {
  const trimmed = questionId?.trim();
  if (!trimmed) return undefined;

  return (
    QUESTIONNAIRE_QUESTION_LOOKUP[trimmed]
    ?? QUESTIONNAIRE_QUESTION_LOOKUP[trimmed.toUpperCase()]
    ?? QUESTIONNAIRE_QUESTION_LOOKUP[trimmed.toLowerCase()]
  );
}

function tokenizeText(text: string | undefined): string[] {
  if (!text) return [];

  return normalizeKeyName(text)
    .split("_")
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);
}

function getQuestionTokens(questionId: string): string[] {
  const tokens = new Set<string>();

  const normalizedId = normalizeKeyName(questionId);
  if (normalizedId) {
    normalizedId
      .split("_")
      .filter(Boolean)
      .forEach((token) => tokens.add(token));
  }

  const question = findQuestion(questionId);
  if (question) {
    tokenizeText(question.text).forEach((token) => tokens.add(token));
  }

  return Array.from(tokens);
}

function getQuestionOptionTokens(questionId: string, optionLabel: string): string[] {
  const tokens = new Set<string>(getQuestionTokens(questionId));

  tokenizeText(optionLabel).forEach((token) => tokens.add(token));

  const question = findQuestion(questionId);
  if (question?.choiceListId) {
    const choiceList = QUESTIONNAIRE_CHOICE_LOOKUP[question.choiceListId];
    const option = choiceList?.options.find((item) =>
      item.label === optionLabel || normalizeKeyName(item.label) === normalizeKeyName(optionLabel),
    );

    if (option) {
      tokenizeText(option.label).forEach((token) => tokens.add(token));
      tokenizeText(option.value).forEach((token) => tokens.add(token));
    }
  }

  return Array.from(tokens);
}

function getValueForQuestion(record: NormalizedRecord, questionId: string): unknown {
  const tokens = getQuestionTokens(questionId);
  if (tokens.length === 0) {
    return getValueForTokens(record, [normalizeKeyName(questionId)]);
  }
  return getValueForTokens(record, tokens);
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

function getValueForTokens(record: NormalizedRecord, tokens: readonly string[]): unknown {
  const match = findMatchingKey(record, tokens);
  return match ? record.get(match) : undefined;
}

const LIKERT_NULL_TERMS = [
  "na",
  "n a",
  "n\/a",
  "not applicable",
  "dont know",
  "don't know",
  "do not know",
  "unknown",
  "unsure",
  "not sure",
  "refused",
  "prefer not",
];

const STRONG_POSITIVE_PHRASES = [
  "very much",
  "extremely",
  "completely",
  "strongly agree",
  "very easy",
  "very likely",
  "very common",
  "very supportive",
  "very respectful",
  "very reliable",
  "very confident",
  "much easier",
  "very well",
  "definitely",
  "always",
];

const MODERATE_POSITIVE_PHRASES = [
  "mostly",
  "quite a bit",
  "agree",
  "easy",
  "likely",
  "common",
  "supportive",
  "respectful",
  "reliable",
  "confident",
  "somewhat easy",
  "somewhat likely",
  "somewhat confident",
  "easier",
  "fairly",
  "usually",
  "well",
  "approve",
];

const NEUTRAL_PHRASES = [
  "neither",
  "neutral",
  "somewhat",
  "moderate",
  "sometimes",
  "about average",
  "mixed",
  "ok",
  "average",
  "balanced",
];

const MODERATE_NEGATIVE_PHRASES = [
  "slightly",
  "a little",
  "disagree",
  "difficult",
  "unlikely",
  "rarely",
  "uncommon",
  "unsupportive",
  "disrespectful",
  "unreliable",
  "harder",
  "less confident",
  "poorly",
];

const STRONG_NEGATIVE_PHRASES = [
  "not at all",
  "strongly disagree",
  "very difficult",
  "very unlikely",
  "never",
  "very uncommon",
  "very unsupportive",
  "very disrespectful",
  "very unreliable",
  "much harder",
  "not confident",
  "not well",
  "very poorly",
];

function normalizeTextValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesPhrase(normalized: string, phrase: string): boolean {
  const trimmed = phrase.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.includes(" ")) {
    return normalized.includes(trimmed);
  }
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`);
  return regex.test(normalized);
}

function parseLikertScore(value: unknown): number | null {
  const numeric = parseNumber(value);
  if (numeric != null) {
    if (!Number.isFinite(numeric)) {
      return null;
    }
    if (numeric <= 0) {
      return 1;
    }
    if (numeric >= 5) {
      return 5;
    }
    return numeric;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = normalizeTextValue(value);
  if (!normalized) {
    return null;
  }

  if (LIKERT_NULL_TERMS.some((term) => normalized === term || normalized.includes(term))) {
    return null;
  }

  if (
    includesPhrase(normalized, "somewhat easy") ||
    includesPhrase(normalized, "somewhat likely") ||
    includesPhrase(normalized, "somewhat supportive") ||
    includesPhrase(normalized, "somewhat confident") ||
    includesPhrase(normalized, "somewhat well")
  ) {
    return 4;
  }

  if (
    includesPhrase(normalized, "somewhat difficult") ||
    includesPhrase(normalized, "somewhat unlikely") ||
    includesPhrase(normalized, "somewhat hard") ||
    includesPhrase(normalized, "somewhat unsupportive") ||
    includesPhrase(normalized, "somewhat poorly")
  ) {
    return 2;
  }

  if (STRONG_POSITIVE_PHRASES.some((phrase) => includesPhrase(normalized, phrase))) {
    return 5;
  }

  if (MODERATE_POSITIVE_PHRASES.some((phrase) => includesPhrase(normalized, phrase))) {
    return 4;
  }

  if (NEUTRAL_PHRASES.some((phrase) => includesPhrase(normalized, phrase))) {
    return 3;
  }

  if (STRONG_NEGATIVE_PHRASES.some((phrase) => includesPhrase(normalized, phrase))) {
    return 1;
  }

  if (MODERATE_NEGATIVE_PHRASES.some((phrase) => includesPhrase(normalized, phrase))) {
    return 2;
  }

  if (includesPhrase(normalized, "disagree")) {
    return includesPhrase(normalized, "strongly disagree") ? 1 : 2;
  }

  if (includesPhrase(normalized, "agree") && !includesPhrase(normalized, "disagree")) {
    return includesPhrase(normalized, "strongly") ? 5 : 4;
  }

  if (includesPhrase(normalized, "unlikely")) {
    return includesPhrase(normalized, "very unlikely") ? 1 : 2;
  }

  if (includesPhrase(normalized, "likely")) {
    return includesPhrase(normalized, "very likely") ? 5 : 4;
  }

  if (includesPhrase(normalized, "very easy")) {
    return 5;
  }

  if (includesPhrase(normalized, "easy") && !includesPhrase(normalized, "uneasy") && !includesPhrase(normalized, "difficult")) {
    return 4;
  }

  if (includesPhrase(normalized, "very difficult") || includesPhrase(normalized, "very hard")) {
    return 1;
  }

  if (includesPhrase(normalized, "difficult") || includesPhrase(normalized, "hard")) {
    return 2;
  }

  if (includesPhrase(normalized, "very common")) {
    return 5;
  }

  if (includesPhrase(normalized, "common") && !includesPhrase(normalized, "uncommon")) {
    return 4;
  }

  if (includesPhrase(normalized, "very uncommon") || includesPhrase(normalized, "very rare")) {
    return 1;
  }

  if (includesPhrase(normalized, "uncommon") || includesPhrase(normalized, "rare")) {
    return 2;
  }

  if (includesPhrase(normalized, "very supportive") || includesPhrase(normalized, "very respectful")) {
    return 5;
  }

  if (includesPhrase(normalized, "supportive") || includesPhrase(normalized, "respectful")) {
    return includesPhrase(normalized, "unsupportive") || includesPhrase(normalized, "disrespectful") ? 2 : 4;
  }

  if (includesPhrase(normalized, "unsupportive") || includesPhrase(normalized, "disrespectful")) {
    return includesPhrase(normalized, "very") ? 1 : 2;
  }

  if (includesPhrase(normalized, "very reliable")) {
    return 5;
  }

  if (includesPhrase(normalized, "reliable") && !includesPhrase(normalized, "unreliable")) {
    return 4;
  }

  if (includesPhrase(normalized, "unreliable")) {
    return includesPhrase(normalized, "very") ? 1 : 2;
  }

  if (includesPhrase(normalized, "very confident")) {
    return 5;
  }

  if (includesPhrase(normalized, "confident")) {
    if (includesPhrase(normalized, "not")) {
      return includesPhrase(normalized, "not at all") ? 1 : 2;
    }
    if (includesPhrase(normalized, "somewhat")) {
      return 3;
    }
    return 4;
  }

  if (includesPhrase(normalized, "very well")) {
    return 5;
  }

  if (includesPhrase(normalized, "well")) {
    return 4;
  }

  if (includesPhrase(normalized, "poorly")) {
    return includesPhrase(normalized, "very") ? 1 : 2;
  }

  if (includesPhrase(normalized, "much easier")) {
    return 5;
  }

  if (includesPhrase(normalized, "easier")) {
    return 4;
  }

  if (includesPhrase(normalized, "much harder")) {
    return 1;
  }

  if (includesPhrase(normalized, "harder")) {
    return 2;
  }

  return null;
}

function averageNumbers(values: Array<number | null | undefined>): number | null {
  const filtered = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (filtered.length === 0) {
    return null;
  }
  const sum = filtered.reduce((acc, value) => acc + value, 0);
  return sum / filtered.length;
}

interface DerivedMetrics {
  motivation?: number | null;
  ability?: number | null;
  descriptiveNorms?: number | null;
  injunctiveNorms?: number | null;
  systemReadiness?: number | null;
  promptFacilitator?: number | null;
  promptSpark?: number | null;
  promptSignal?: number | null;
  currentUse?: boolean | null;
}

function computePromptExposure(
  record: NormalizedRecord,
  groups: string[][],
  options?: { noPromptTokens?: string[] },
): number | null {
  if (options?.noPromptTokens) {
    const noPrompt = parseBoolean(getValueForTokens(record, options.noPromptTokens));
    if (noPrompt === true) {
      return 1;
    }
  }

  const exposures = groups.map((tokens) => {
    const raw = getValueForTokens(record, tokens);
    const parsed = parseBoolean(raw);
    if (parsed != null) {
      return parsed ? 1 : 0;
    }
    if (typeof raw === "string") {
      const normalized = normalizeTextValue(raw);
      if (!normalized) {
        return null;
      }
      if (normalized.includes("yes")) {
        return 1;
      }
      if (normalized.includes("no")) {
        return 0;
      }
    }
    if (typeof raw === "number") {
      if (!Number.isFinite(raw)) {
        return null;
      }
      return raw > 0 ? 1 : 0;
    }
    return null;
  });

  const valid = exposures.filter((value): value is number => value != null);
  if (valid.length === 0) {
    return null;
  }

  const ratio = valid.reduce((acc, value) => acc + value, 0) / valid.length;
  return ratio * 4 + 1;
}

function deriveMetrics(record: NormalizedRecord): DerivedMetrics {
  const motivation = averageNumbers([
    parseLikertScore(getValueForQuestion(record, "C1")),
    parseLikertScore(getValueForQuestion(record, "C2")),
    parseLikertScore(getValueForQuestion(record, "C3")),
    parseLikertScore(getValueForQuestion(record, "C4")),
  ]);

  const ability = averageNumbers([
    parseLikertScore(getValueForQuestion(record, "D1")),
    parseLikertScore(getValueForQuestion(record, "D2")),
    parseLikertScore(getValueForQuestion(record, "D3")),
    parseLikertScore(getValueForQuestion(record, "D4")),
    parseLikertScore(getValueForQuestion(record, "D5")),
    parseLikertScore(getValueForQuestion(record, "D6")),
  ]);

  const descriptiveNorms = parseLikertScore(getValueForQuestion(record, "F1"));
  const injunctiveNorms = parseLikertScore(getValueForQuestion(record, "F2"));

  const systemReadiness = averageNumbers([
    parseLikertScore(getValueForQuestion(record, "G1")),
    parseLikertScore(getValueForQuestion(record, "G2")),
    parseLikertScore(getValueForQuestion(record, "G3")),
  ]);

  const promptLikelihood = parseLikertScore(getValueForQuestion(record, "E2"));
  const noPromptTokens = getQuestionOptionTokens("E1", "No prompts received");
  const noPromptOptionTokens = noPromptTokens.length > 0 ? [...noPromptTokens] : undefined;

  const facilitatorExposure = computePromptExposure(
    record,
    [
      getQuestionOptionTokens("E1", "Yes, from a health worker"),
      getQuestionOptionTokens("E1", "Yes, from community/religious leaders"),
    ],
    { noPromptTokens: noPromptOptionTokens },
  );

  const sparkExposure = computePromptExposure(
    record,
    [getQuestionOptionTokens("E1", "Yes, from media (radio, TV, social media)")],
    { noPromptTokens: noPromptOptionTokens },
  );

  const signalExposure = computePromptExposure(
    record,
    [getQuestionOptionTokens("E1", "Yes, from a partner/spouse")],
    { noPromptTokens: noPromptOptionTokens },
  );

  let currentUse = parseBoolean(getValueForQuestion(record, "B2"));
  if (currentUse == null) {
    const method = getValueForQuestion(record, "B3");
    if (typeof method === "string" && method.trim().length > 0) {
      currentUse = true;
    }
  }

  return {
    motivation,
    ability,
    descriptiveNorms,
    injunctiveNorms,
    systemReadiness,
    promptFacilitator: facilitatorExposure ?? promptLikelihood ?? null,
    promptSpark: sparkExposure ?? promptLikelihood ?? null,
    promptSignal: signalExposure ?? promptLikelihood ?? null,
    currentUse,
  };
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

  const questionValue = getValueForQuestion(record, fieldMap[field]);
  if (questionValue !== undefined) {
    return questionValue;
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

    const derived = deriveMetrics(normalizedRecord);

    const motivation =
      parseNumber(lookupFieldValue(normalizedRecord, "motivation", fieldMap)) ?? derived.motivation ?? null;
    const ability =
      parseNumber(lookupFieldValue(normalizedRecord, "ability", fieldMap)) ?? derived.ability ?? null;
    const descriptiveNorms =
      parseNumber(lookupFieldValue(normalizedRecord, "descriptiveNorms", fieldMap))
        ?? derived.descriptiveNorms ?? null;
    const injunctiveNorms =
      parseNumber(lookupFieldValue(normalizedRecord, "injunctiveNorms", fieldMap))
        ?? derived.injunctiveNorms ?? null;
    const systemReadiness =
      parseNumber(lookupFieldValue(normalizedRecord, "systemReadiness", fieldMap))
        ?? derived.systemReadiness ?? null;
    const currentUse =
      parseBoolean(lookupFieldValue(normalizedRecord, "currentUse", fieldMap))
        ?? derived.currentUse ?? null;
    const promptFacilitator =
      parseNumber(lookupFieldValue(normalizedRecord, "promptFacilitator", fieldMap))
        ?? derived.promptFacilitator ?? null;
    const promptSpark =
      parseNumber(lookupFieldValue(normalizedRecord, "promptSpark", fieldMap))
        ?? derived.promptSpark ?? null;
    const promptSignal =
      parseNumber(lookupFieldValue(normalizedRecord, "promptSignal", fieldMap))
        ?? derived.promptSignal ?? null;

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
    if (!normalized) return null;
    if ([
      "n/a",
      "na",
      "not applicable",
      "dont know",
      "don't know",
      "do not know",
      "unknown",
      "unsure",
      "not sure",
    ].includes(normalized)) {
      return null;
    }
    if (["yes", "true", "1", "y"].includes(normalized)) return true;
    if (["no", "false", "0", "n"].includes(normalized)) return false;
    if (/\byes\b/.test(normalized)) return true;
    if (/\bno\b/.test(normalized)) return false;
    if (/\bnone\b/.test(normalized)) return false;
    if (/\bnot using\b/.test(normalized) || /\bnot currently\b/.test(normalized)) return false;
    if (/\busing\b/.test(normalized) && !/\bnot\b/.test(normalized)) return true;
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

