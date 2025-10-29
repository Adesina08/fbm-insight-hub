import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  TrendingUp,
  Activity,
  Target,
  RefreshCcw,
  Calendar,
  Heart,
  GraduationCap,
  MapPin,
  UserPlus,
  Zap,
  BarChart3,
  Network,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DESCRIPTIVE_UNKNOWN_VALUE,
  type AbilitySubdomainId,
  type DashboardAnalytics,
  type DescriptiveFilterOption,
  type DescriptiveSubmission,
  type MotivationSubdomainId,
  type QuadrantInsight,
} from "@/lib/googleSheets";
import { formatAverage, formatNumber, formatPercentage } from "@/lib/dashboardFormatters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardOverviewProps {
  stats?: DashboardAnalytics["stats"];
  quadrants?: QuadrantInsight[];
  lastUpdated?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  metadata?: DashboardOverviewMetadata | null;
  descriptive?: DashboardAnalytics["descriptive"];
}

export interface DashboardOverviewMetadata {
  primary: string;
  secondary?: string;
}

const ALL_FILTER_VALUE = "all";

const buildFilterOptions = (
  descriptiveData: DashboardAnalytics["descriptive"] | null,
): {
  age: DescriptiveFilterOption[];
  marital: DescriptiveFilterOption[];
  education: DescriptiveFilterOption[];
  location: DescriptiveFilterOption[];
  parity: DescriptiveFilterOption[];
} | null => {
  if (!descriptiveData) {
    return null;
  }

  const addAllOption = (options: DescriptiveFilterOption[], label: string): DescriptiveFilterOption[] => [
    { value: ALL_FILTER_VALUE, label, count: descriptiveData.submissions.length },
    ...options,
  ];

  return {
    age: addAllOption(descriptiveData.filters.age, "All ages"),
    marital: addAllOption(descriptiveData.filters.maritalStatus, "All marital statuses"),
    education: addAllOption(descriptiveData.filters.educationLevel, "All education levels"),
    location: addAllOption(descriptiveData.filters.location, "All locations"),
    parity: addAllOption(descriptiveData.filters.parity, "All parity levels"),
  };
};

const filterSubmissions = (
  descriptiveData: DashboardAnalytics["descriptive"] | null,
  filters: {
    age: string;
    marital: string;
    education: string;
    location: string;
    parity: string;
  },
): DescriptiveSubmission[] => {
  if (!descriptiveData) {
    return [];
  }

  const matchesCategory = (
    value: DescriptiveSubmission["maritalStatus"],
    filterValue: string,
  ) => {
    if (filterValue === ALL_FILTER_VALUE) return true;
    if (filterValue === DESCRIPTIVE_UNKNOWN_VALUE) {
      return value == null;
    }
    return value?.value === filterValue;
  };

  const matchesBucket = (bucket: string | null, filterValue: string) => {
    if (filterValue === ALL_FILTER_VALUE) return true;
    if (filterValue === DESCRIPTIVE_UNKNOWN_VALUE) {
      return bucket === DESCRIPTIVE_UNKNOWN_VALUE;
    }
    return bucket === filterValue;
  };

  return descriptiveData.submissions.filter((submission) => {
    const ageMatch = matchesBucket(submission.ageBucket, filters.age);
    const parityMatch = matchesBucket(submission.parityBucket, filters.parity);
    const maritalMatch = matchesCategory(submission.maritalStatus, filters.marital);
    const educationMatch = matchesCategory(submission.educationLevel, filters.education);
    const locationMatch = matchesCategory(submission.location, filters.location);

    return ageMatch && parityMatch && maritalMatch && educationMatch && locationMatch;
  });
};

const selectRecords = (
  descriptiveData: DashboardAnalytics["descriptive"] | null,
  filteredSubmissions: DescriptiveSubmission[],
) => {
  if (!descriptiveData) {
    return [] as DescriptiveSubmission[];
  }

  if (filteredSubmissions.length > 0) {
    return filteredSubmissions;
  }

  return descriptiveData.submissions;
};

const buildBaseCards = (stats: DashboardAnalytics["stats"] | undefined): KpiCard[] => {
  const averageMotivation = stats?.averageMotivation?.value;
  const averageAbility = stats?.averageAbility?.value;

  return [
    {
      title: "Total Respondents",
      value: formatNumber(stats?.totalRespondents?.value),
      trendIcon: Users,
      gradient: "from-chart-1 to-chart-1/60",
    },
    {
      title: "Contraceptive Users",
      value: formatNumber(stats?.currentUsers?.value),
      trendIcon: Target,
      gradient: "from-chart-2 to-chart-2/60",
    },
    {
      title: "Avg Motivation Score",
      value:
        averageMotivation == null || Number.isNaN(averageMotivation)
          ? "n/a"
          : averageMotivation.toFixed(2),
      trendIcon: TrendingUp,
      suffix: " / 5",
      gradient: "from-quadrant-high-m-high-a to-quadrant-high-m-high-a/60",
    },
    {
      title: "Avg Ability Score",
      value:
        averageAbility == null || Number.isNaN(averageAbility)
          ? "n/a"
          : averageAbility.toFixed(2),
      trendIcon: Activity,
      suffix: " / 5",
      gradient: "from-chart-4 to-chart-4/60",
    },
  ];
};

interface NumericSummary {
  mean: number | null;
  median: number | null;
  sd: number | null;
  count: number;
}

interface LikertSummary extends NumericSummary {
  topValue: number | null;
  topShare: number | null;
  positiveShare: number | null;
}

interface CategorySummary {
  label: string | null;
  count: number;
  share: number | null;
  unknownCount: number;
}

type KpiCard = {
  title: string;
  value: string;
  trendIcon: LucideIcon;
  suffix?: string;
  gradient: string;
};

const computeNumericSummary = (values: Array<number | null>): NumericSummary => {
  const numeric = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (numeric.length === 0) {
    return { mean: null, median: null, sd: null, count: 0 };
  }

  const mean = numeric.reduce((acc, value) => acc + value, 0) / numeric.length;
  const sorted = [...numeric].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const variance = sorted.length > 1
    ? sorted.reduce((acc, value) => acc + (value - mean) ** 2, 0) / (sorted.length - 1)
    : 0;
  const sd = sorted.length > 1 ? Math.sqrt(variance) : 0;

  return { mean, median, sd, count: numeric.length };
};

const computeLikertSummary = (values: Array<number | null>): LikertSummary => {
  const summary = computeNumericSummary(values);
  const numeric = values.filter((value): value is number => value != null && Number.isFinite(value));
  const counts = new Map<number, number>();

  numeric.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  let topValue: number | null = null;
  let topCount = 0;
  counts.forEach((count, value) => {
    if (count > topCount) {
      topCount = count;
      topValue = value;
    }
  });

  const positiveCount = numeric.filter((value) => value >= 4).length;

  return {
    ...summary,
    topValue,
    topShare: summary.count > 0 && topCount > 0 ? topCount / summary.count : null,
    positiveShare: summary.count > 0 ? positiveCount / summary.count : null,
  };
};

const computeCategorySummary = (
  records: DescriptiveSubmission[],
  accessor: (record: DescriptiveSubmission) => DescriptiveSubmission["maritalStatus"],
): CategorySummary => {
  if (records.length === 0) {
    return { label: null, count: 0, share: null, unknownCount: 0 };
  }

  const counts = new Map<string, { label: string; count: number; isUnknown: boolean }>();

  records.forEach((record) => {
    const item = accessor(record);
    const key = item ? item.value : DESCRIPTIVE_UNKNOWN_VALUE;
    const label = item ? item.label : "Unknown / not reported";
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { label, count: 1, isUnknown: !item });
    }
  });

  const knownEntries = Array.from(counts.values()).filter((entry) => !entry.isUnknown);
  const topEntry = knownEntries.sort((a, b) => b.count - a.count)[0];
  const unknownCount = counts.get(DESCRIPTIVE_UNKNOWN_VALUE)?.count ?? 0;

  if (!topEntry) {
    return { label: null, count: 0, share: null, unknownCount };
  }

  return {
    label: topEntry.label,
    count: topEntry.count,
    share: topEntry.count / records.length,
    unknownCount,
  };
};

const formatDecimal = (value: number | null, digits = 1) => {
  if (value == null || Number.isNaN(value)) return "n/a";
  return value.toFixed(digits);
};

const findTopSummary = <T,>(items: Array<{ definition: T; summary: NumericSummary }> | null) => {
  if (!items) return null;

  let top: { definition: T; summary: NumericSummary } | null = null;
  for (const item of items) {
    if (item.summary.count === 0 || item.summary.mean == null || Number.isNaN(item.summary.mean)) {
      continue;
    }
    if (!top || (item.summary.mean ?? 0) > (top.summary.mean ?? 0)) {
      top = item;
    }
  }

  return top;
};

const MOTIVATION_SUBDOMAINS: ReadonlyArray<{
  key: MotivationSubdomainId;
  title: string;
  description: string;
}> = [
  { key: "C1", title: "Personal desire", description: "How much respondents want to use a method." },
  { key: "C2", title: "Perceived benefit", description: "Belief that contraception will benefit them." },
  { key: "C3", title: "Emotional response", description: "How pleasant or unpleasant use feels." },
  { key: "C4", title: "Social acceptance", description: "Perceived approval from important people." },
] as const;

const ABILITY_SUBDOMAINS: ReadonlyArray<{
  key: AbilitySubdomainId;
  title: string;
  description: string;
}> = [
  { key: "D1", title: "Finding a method", description: "Ease of locating a modern method." },
  { key: "D2", title: "Affordability", description: "Perceived affordability of methods." },
  { key: "D3", title: "Physical access", description: "Physical ease of getting and using methods." },
  { key: "D4", title: "Mental access", description: "Ease of understanding and remembering use." },
  { key: "D5", title: "Fits daily life", description: "How well contraception fits routines." },
  { key: "D6", title: "Self-efficacy", description: "Confidence in using a method correctly." },
] as const;

const lastUpdatedLabel = (timestamp?: string) => {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
};

const LoadingState = () => (
  <div className="space-y-8 animate-fade-in">
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="border-0 bg-card/40">
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card className="border-0 bg-card/40">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
    <AlertTitle>Unable to load dashboard data</AlertTitle>
    <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" />
          Retry
        </Button>
      ) : null}
    </AlertDescription>
  </Alert>
);

const DashboardOverview = ({
  stats,
  quadrants,
  lastUpdated,
  isLoading = false,
  error,
  onRetry,
  metadata,
  descriptive,
}: DashboardOverviewProps) => {
  const [ageFilter, setAgeFilter] = useState<string>(ALL_FILTER_VALUE);
  const [maritalFilter, setMaritalFilter] = useState<string>(ALL_FILTER_VALUE);
  const [educationFilter, setEducationFilter] = useState<string>(ALL_FILTER_VALUE);
  const [locationFilter, setLocationFilter] = useState<string>(ALL_FILTER_VALUE);
  const [parityFilter, setParityFilter] = useState<string>(ALL_FILTER_VALUE);

  const descriptiveData = descriptive ?? null;

  const [filterOptions, setFilterOptions] = useState<ReturnType<typeof buildFilterOptions>>(null);

  useEffect(() => {
    setFilterOptions(buildFilterOptions(descriptiveData));
  }, [descriptiveData]);

  useEffect(() => {
    if (!filterOptions) {
      setAgeFilter(ALL_FILTER_VALUE);
      setMaritalFilter(ALL_FILTER_VALUE);
      setEducationFilter(ALL_FILTER_VALUE);
      setLocationFilter(ALL_FILTER_VALUE);
      setParityFilter(ALL_FILTER_VALUE);
      return;
    }

    setAgeFilter((current) =>
      filterOptions.age.some((option) => option.value === current) ? current : ALL_FILTER_VALUE,
    );
    setMaritalFilter((current) =>
      filterOptions.marital.some((option) => option.value === current) ? current : ALL_FILTER_VALUE,
    );
    setEducationFilter((current) =>
      filterOptions.education.some((option) => option.value === current) ? current : ALL_FILTER_VALUE,
    );
    setLocationFilter((current) =>
      filterOptions.location.some((option) => option.value === current) ? current : ALL_FILTER_VALUE,
    );
    setParityFilter((current) =>
      filterOptions.parity.some((option) => option.value === current) ? current : ALL_FILTER_VALUE,
    );
  }, [filterOptions]);

  const filteredSubmissions = filterSubmissions(descriptiveData, {
    age: ageFilter,
    marital: maritalFilter,
    education: educationFilter,
    location: locationFilter,
    parity: parityFilter,
  });

  const totalSubmissions = descriptiveData?.submissions.length ?? 0;
  const filteredCount = filteredSubmissions.length;
  const isFiltered = [ageFilter, maritalFilter, educationFilter, locationFilter, parityFilter]
    .some((value) => value !== ALL_FILTER_VALUE);
  const showFilteredEmpty = Boolean(descriptiveData && isFiltered && filteredCount === 0);

  const demographicSummary = (() => {
    if (!descriptiveData || showFilteredEmpty) {
      return null;
    }

    const records = selectRecords(descriptiveData, filteredSubmissions);

    if (records.length === 0) {
      return null;
    }

    return {
      count: records.length,
      age: computeNumericSummary(records.map((record) => record.age)),
      parity: computeNumericSummary(records.map((record) => record.parity)),
      marital: computeCategorySummary(records, (record) => record.maritalStatus),
      education: computeCategorySummary(records, (record) => record.educationLevel),
      location: computeCategorySummary(records, (record) => record.location),
    };
  })();

  const motivationSummaries: Array<{
    definition: (typeof MOTIVATION_SUBDOMAINS)[number];
    summary: NumericSummary;
  }> | null = (() => {
    if (!descriptiveData || showFilteredEmpty) {
      return null;
    }

    const records = selectRecords(descriptiveData, filteredSubmissions);

    return MOTIVATION_SUBDOMAINS.map((definition) => ({
      definition,
      summary: computeNumericSummary(records.map((record) => record.motivationItems?.[definition.key] ?? null)),
    }));
  })();

  const abilitySummaries: Array<{
    definition: (typeof ABILITY_SUBDOMAINS)[number];
    summary: NumericSummary;
  }> | null = (() => {
    if (!descriptiveData || showFilteredEmpty) {
      return null;
    }

    const records = selectRecords(descriptiveData, filteredSubmissions);

    return ABILITY_SUBDOMAINS.map((definition) => ({
      definition,
      summary: computeNumericSummary(records.map((record) => record.abilityItems?.[definition.key] ?? null)),
    }));
  })();

  const normSummaries = (() => {
    if (!descriptiveData || showFilteredEmpty) {
      return null;
    }

    const records = selectRecords(descriptiveData, filteredSubmissions);

    return {
      descriptive: computeLikertSummary(records.map((record) => record.descriptiveNorms)),
      injunctive: computeLikertSummary(records.map((record) => record.injunctiveNorms)),
    };
  })();

  const handleResetFilters = () => {
    setAgeFilter(ALL_FILTER_VALUE);
    setMaritalFilter(ALL_FILTER_VALUE);
    setEducationFilter(ALL_FILTER_VALUE);
    setLocationFilter(ALL_FILTER_VALUE);
    setParityFilter(ALL_FILTER_VALUE);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!stats || !quadrants) {
    return <ErrorState message="No submissions are available yet." onRetry={onRetry} />;
  }

  const metadataContent: DashboardOverviewMetadata | null =
    metadata === undefined
      ? {
          primary: `Last data sync: ${lastUpdatedLabel(lastUpdated)}`,
          secondary: "Data refreshes automatically every minute.",
        }
      : metadata;

  const baseCards = buildBaseCards(stats);

  const descriptiveCards: KpiCard[] = (() => {
    const items: KpiCard[] = [];

    if (demographicSummary) {
      items.push(
        {
          title: "Mean age",
          value: formatDecimal(demographicSummary.age.mean, 1),
          trendIcon: Calendar,
          suffix: " yrs",
          gradient: "from-sky-500 to-sky-300/60",
        },
        {
          title: "Top marital status",
          value: demographicSummary.marital.label ?? "n/a",
          trendIcon: Heart,
          suffix:
            demographicSummary.marital.share != null
              ? ` · ${formatPercentage(demographicSummary.marital.share * 100)}`
              : undefined,
          gradient: "from-rose-500 to-rose-300/60",
        },
        {
          title: "Top education level",
          value: demographicSummary.education.label ?? "n/a",
          trendIcon: GraduationCap,
          suffix:
            demographicSummary.education.share != null
              ? ` · ${formatPercentage(demographicSummary.education.share * 100)}`
              : undefined,
          gradient: "from-indigo-500 to-indigo-300/60",
        },
        {
          title: "Leading location",
          value: demographicSummary.location.label ?? "n/a",
          trendIcon: MapPin,
          suffix:
            demographicSummary.location.share != null
              ? ` · ${formatPercentage(demographicSummary.location.share * 100)}`
              : undefined,
          gradient: "from-emerald-500 to-emerald-300/60",
        },
        {
          title: "Mean parity",
          value: formatDecimal(demographicSummary.parity.mean, 1),
          trendIcon: UserPlus,
          suffix: " children",
          gradient: "from-amber-500 to-amber-300/60",
        },
      );
    }

    const topMotivation = findTopSummary(motivationSummaries);
    if (topMotivation) {
      items.push({
        title: "Strongest motivation",
        value: topMotivation.definition.title,
        trendIcon: BarChart3,
        suffix:
          topMotivation.summary.mean != null
            ? ` · ${topMotivation.summary.mean.toFixed(2)}/5`
            : undefined,
        gradient: "from-violet-500 to-violet-300/60",
      });
    }

    const topAbility = findTopSummary(abilitySummaries);
    if (topAbility) {
      items.push({
        title: "Strongest ability",
        value: topAbility.definition.title,
        trendIcon: Zap,
        suffix:
          topAbility.summary.mean != null
            ? ` · ${topAbility.summary.mean.toFixed(2)}/5`
            : undefined,
        gradient: "from-orange-500 to-orange-300/60",
      });
    }

    if (normSummaries) {
      items.push(
        {
          title: "High descriptive norms",
          value:
            normSummaries.descriptive.positiveShare != null
              ? formatPercentage(normSummaries.descriptive.positiveShare * 100)
              : "n/a",
          trendIcon: Network,
          suffix:
            normSummaries.descriptive.mean != null
              ? ` · Avg ${normSummaries.descriptive.mean.toFixed(2)}/5`
              : undefined,
          gradient: "from-cyan-500 to-cyan-300/60",
        },
        {
          title: "High injunctive norms",
          value:
            normSummaries.injunctive.positiveShare != null
              ? formatPercentage(normSummaries.injunctive.positiveShare * 100)
              : "n/a",
          trendIcon: UserCheck,
          suffix:
            normSummaries.injunctive.mean != null
              ? ` · Avg ${normSummaries.injunctive.mean.toFixed(2)}/5`
              : undefined,
          gradient: "from-teal-500 to-teal-300/60",
        },
      );
    }

    return items;
  })();

  const cards = [...baseCards, ...descriptiveCards];

  const [activeSlide, setActiveSlide] = useState(0);

  const chunkedCards = (() => {
    const chunkSize = 4;
    const chunks: KpiCard[][] = [];

    for (let index = 0; index < cards.length; index += chunkSize) {
      chunks.push(cards.slice(index, index + chunkSize));
    }

    return chunks.length > 0 ? chunks : [[]];
  })();

  const hasMultipleSlides = chunkedCards.length > 1;
  const safeActiveSlide = Math.min(activeSlide, chunkedCards.length - 1);
  const visibleCards = chunkedCards[safeActiveSlide] ?? [];

  useEffect(() => {
    if (activeSlide !== safeActiveSlide) {
      setActiveSlide(safeActiveSlide);
    }
  }, [activeSlide, safeActiveSlide]);

  return (
    <div className="space-y-8 animate-fade-in print:space-y-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 md:flex-row md:items-center md:justify-between print:flex-row print:items-center print:justify-between print:gap-6 print:rounded-xl print:border print:border-slate-200/80 print:bg-white/80 print:p-5 print:shadow-sm">
        {metadataContent ? (
          <div>
            <p className="text-sm text-muted-foreground print:text-slate-600">
              {metadataContent.primary}
            </p>
            {metadataContent.secondary ? (
              <p className="text-xs text-muted-foreground print:text-slate-500">{metadataContent.secondary}</p>
            ) : null}
          </div>
        ) : null}
        {onRetry ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex items-center gap-2 print:hidden"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh now
          </Button>
        ) : null}
      </div>

      {descriptiveData ? (
        <div className="mx-auto w-full max-w-6xl space-y-4 rounded-xl border border-border/40 bg-card/50 p-4 shadow-sm print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Filter respondents</h3>
              <p className="text-xs text-muted-foreground">
                Showing {formatNumber(filteredCount, { maximumFractionDigits: 0 })} of {formatNumber(totalSubmissions, { maximumFractionDigits: 0 })} respondents.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              disabled={!isFiltered}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[160px] flex-1 md:flex-initial md:w-[200px]">
              <Select value={ageFilter} onValueChange={setAgeFilter} disabled={!filterOptions}>
                <SelectTrigger className="w-full bg-card/60">
                  <SelectValue placeholder="All ages" />
                </SelectTrigger>
                <SelectContent>
                  {(filterOptions?.age ?? []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} · {formatNumber(option.count, { maximumFractionDigits: 0 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px] flex-1 md:flex-initial md:w-[220px]">
              <Select value={maritalFilter} onValueChange={setMaritalFilter} disabled={!filterOptions}>
                <SelectTrigger className="w-full bg-card/60">
                  <SelectValue placeholder="All marital statuses" />
                </SelectTrigger>
                <SelectContent>
                  {(filterOptions?.marital ?? []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} · {formatNumber(option.count, { maximumFractionDigits: 0 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px] flex-1 md:flex-initial md:w-[220px]">
              <Select value={educationFilter} onValueChange={setEducationFilter} disabled={!filterOptions}>
                <SelectTrigger className="w-full bg-card/60">
                  <SelectValue placeholder="All education levels" />
                </SelectTrigger>
                <SelectContent>
                  {(filterOptions?.education ?? []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} · {formatNumber(option.count, { maximumFractionDigits: 0 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px] flex-1 md:flex-initial md:w-[220px]">
              <Select value={locationFilter} onValueChange={setLocationFilter} disabled={!filterOptions}>
                <SelectTrigger className="w-full bg-card/60">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  {(filterOptions?.location ?? []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} · {formatNumber(option.count, { maximumFractionDigits: 0 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px] flex-1 md:flex-initial md:w-[200px]">
              <Select value={parityFilter} onValueChange={setParityFilter} disabled={!filterOptions}>
                <SelectTrigger className="w-full bg-card/60">
                  <SelectValue placeholder="All parity levels" />
                </SelectTrigger>
                <SelectContent>
                  {(filterOptions?.parity ?? []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} · {formatNumber(option.count, { maximumFractionDigits: 0 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {showFilteredEmpty ? (
            <Alert variant="secondary" className="border-border/60 bg-card/60">
              <AlertTitle>No respondents match the selected filters</AlertTitle>
              <AlertDescription className="text-sm text-muted-foreground">
                Adjust one or more filters to widen the selection.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-3 print:hidden">
        {hasMultipleSlides ? (
          <div className="flex items-center gap-3 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">KPI set {activeSlide + 1}</span>
            <span className="text-muted-foreground">of {chunkedCards.length}</span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setActiveSlide((current) => Math.max(0, current - 1))}
                disabled={activeSlide === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setActiveSlide((current) => Math.min(chunkedCards.length - 1, current + 1))}
                disabled={activeSlide >= chunkedCards.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 print:hidden">
        {visibleCards.map((card) => {
          const Icon = card.trendIcon;
          return (
            <Card
              key={card.title}
              className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm print:border print:border-primary/20 print:bg-white/95"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5 group-hover:opacity-10 transition-opacity print:opacity-20`}
              />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 print:pb-4">
                <CardTitle className="text-sm font-medium text-muted-foreground print:text-slate-700">
                  {card.title}
                </CardTitle>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg print:shadow-md print:ring-2 print:ring-white/70`}>
                  <Icon className="h-5 w-5 text-white print:text-white" />
                </div>
              </CardHeader>
              <CardContent className="print:bg-white/90">
                <div className="text-3xl font-bold print:text-[24pt] print:text-slate-900">
                  {card.value}
                  {card.suffix && card.value !== "n/a" ? (
                    <span className="text-base font-medium text-muted-foreground print:text-slate-600">{card.suffix}</span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="hidden print:grid print:grid-cols-2 print:gap-5">
        {cards.map((card) => {
          const Icon = card.trendIcon;
          return (
            <Card
              key={`${card.title}-print`}
              className="group relative overflow-hidden print:border print:border-primary/20 print:bg-white/95"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-20`} />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3 text-base">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </span>
                  {card.title}
                </CardTitle>
                {card.suffix ? (
                  <CardDescription className="text-xs text-muted-foreground">
                    {card.suffix}
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="relative">
                <p className="text-3xl font-semibold tracking-tight">{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {demographicSummary ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Demographic profile</h3>
            <span className="text-xs text-muted-foreground">n = {formatNumber(demographicSummary.count, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 print:grid-cols-3">
            <Card className="relative border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Age</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="text-3xl font-semibold text-foreground">
                  {formatDecimal(demographicSummary.age.mean, 1)}
                  <span className="ml-1 text-base font-medium text-muted-foreground">yrs</span>
                </p>
                <p>Median {formatDecimal(demographicSummary.age.median, 0)} yrs · SD {formatDecimal(demographicSummary.age.sd, 1)}</p>
                <p className="text-xs text-muted-foreground">
                  Valid responses: {formatNumber(demographicSummary.age.count, { maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
            <Card className="relative border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Marital status</CardTitle>
                <div className="rounded-lg bg-rose-100/50 p-2 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400">
                  <Heart className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="text-2xl font-semibold text-foreground">
                  {demographicSummary.marital.label ?? "n/a"}
                </p>
                <p>
                  {demographicSummary.marital.share != null
                    ? `${formatPercentage(demographicSummary.marital.share * 100)} of respondents`
                    : "No responses"}
                </p>
                {demographicSummary.marital.unknownCount > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Unknown: {formatNumber(demographicSummary.marital.unknownCount, { maximumFractionDigits: 0 })}
                  </p>
                ) : null}
              </CardContent>
            </Card>
            <Card className="relative border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Education</CardTitle>
                <div className="rounded-lg bg-indigo-100/60 p-2 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <GraduationCap className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="text-2xl font-semibold text-foreground">
                  {demographicSummary.education.label ?? "n/a"}
                </p>
                <p>
                  {demographicSummary.education.share != null
                    ? `${formatPercentage(demographicSummary.education.share * 100)} of respondents`
                    : "No responses"}
                </p>
                {demographicSummary.education.unknownCount > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Unknown: {formatNumber(demographicSummary.education.unknownCount, { maximumFractionDigits: 0 })}
                  </p>
                ) : null}
              </CardContent>
            </Card>
            <Card className="relative border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Location</CardTitle>
                <div className="rounded-lg bg-emerald-100/60 p-2 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <MapPin className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="text-2xl font-semibold text-foreground">
                  {demographicSummary.location.label ?? "n/a"}
                </p>
                <p>
                  {demographicSummary.location.share != null
                    ? `${formatPercentage(demographicSummary.location.share * 100)} of respondents`
                    : "No responses"}
                </p>
                {demographicSummary.location.unknownCount > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Unknown: {formatNumber(demographicSummary.location.unknownCount, { maximumFractionDigits: 0 })}
                  </p>
                ) : null}
              </CardContent>
            </Card>
            <Card className="relative border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Parity</CardTitle>
                <div className="rounded-lg bg-amber-100/60 p-2 text-amber-500 dark:bg-amber-500/10 dark:text-amber-500">
                  <UserPlus className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="text-3xl font-semibold text-foreground">
                  {formatDecimal(demographicSummary.parity.mean, 1)}
                  <span className="ml-1 text-base font-medium text-muted-foreground">children</span>
                </p>
                <p>Median {formatDecimal(demographicSummary.parity.median, 1)} · SD {formatDecimal(demographicSummary.parity.sd, 1)}</p>
                <p className="text-xs text-muted-foreground">
                  Valid responses: {formatNumber(demographicSummary.parity.count, { maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {motivationSummaries && motivationSummaries.some((item) => item.summary.count > 0) ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Motivation sub-domains</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 print:grid-cols-2">
            {motivationSummaries.map(({ definition, summary }) => (
              <Card key={definition.key} className="relative border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="space-y-1 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{definition.title}</CardTitle>
                  <CardDescription>{definition.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p className="text-2xl font-semibold text-foreground">
                    {summary.mean != null ? summary.mean.toFixed(2) : "n/a"}
                    {summary.mean != null ? (
                      <span className="ml-1 text-sm font-medium text-muted-foreground">/ 5</span>
                    ) : null}
                  </p>
                  <p>Median {formatDecimal(summary.median, 2)} · SD {formatDecimal(summary.sd, 2)}</p>
                  <p className="text-xs text-muted-foreground">
                    Valid responses: {formatNumber(summary.count, { maximumFractionDigits: 0 })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {abilitySummaries && abilitySummaries.some((item) => item.summary.count > 0) ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Ability sub-domains</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-2">
            {abilitySummaries.map(({ definition, summary }) => (
              <Card key={definition.key} className="relative border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="space-y-1 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{definition.title}</CardTitle>
                  <CardDescription>{definition.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p className="text-2xl font-semibold text-foreground">
                    {summary.mean != null ? summary.mean.toFixed(2) : "n/a"}
                    {summary.mean != null ? (
                      <span className="ml-1 text-sm font-medium text-muted-foreground">/ 5</span>
                    ) : null}
                  </p>
                  <p>Median {formatDecimal(summary.median, 2)} · SD {formatDecimal(summary.sd, 2)}</p>
                  <p className="text-xs text-muted-foreground">
                    Valid responses: {formatNumber(summary.count, { maximumFractionDigits: 0 })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {normSummaries && (normSummaries.descriptive.count > 0 || normSummaries.injunctive.count > 0) ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Social norms</h3>
          <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
            <Card className="relative border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Descriptive norms</CardTitle>
                <CardDescription>Perceived prevalence of contraception use in the community.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="text-2xl font-semibold text-foreground">
                  {normSummaries.descriptive.mean != null ? normSummaries.descriptive.mean.toFixed(2) : "n/a"}
                  {normSummaries.descriptive.mean != null ? (
                    <span className="ml-1 text-sm font-medium text-muted-foreground">/ 5</span>
                  ) : null}
                </p>
                <p>Median {formatDecimal(normSummaries.descriptive.median, 2)} · SD {formatDecimal(normSummaries.descriptive.sd, 2)}</p>
                <p>
                  High agreement (4–5): {normSummaries.descriptive.positiveShare != null
                    ? formatPercentage(normSummaries.descriptive.positiveShare * 100)
                    : "n/a"}
                </p>
                {normSummaries.descriptive.topValue != null ? (
                  <p>
                    Most common rating: {normSummaries.descriptive.topValue}
                    {normSummaries.descriptive.topShare != null
                      ? ` (${formatPercentage(normSummaries.descriptive.topShare * 100)})`
                      : ""}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Valid responses: {formatNumber(normSummaries.descriptive.count, { maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
            <Card className="relative border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Injunctive norms</CardTitle>
                <CardDescription>Perceived approval of contraception by important others.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="text-2xl font-semibold text-foreground">
                  {normSummaries.injunctive.mean != null ? normSummaries.injunctive.mean.toFixed(2) : "n/a"}
                  {normSummaries.injunctive.mean != null ? (
                    <span className="ml-1 text-sm font-medium text-muted-foreground">/ 5</span>
                  ) : null}
                </p>
                <p>Median {formatDecimal(normSummaries.injunctive.median, 2)} · SD {formatDecimal(normSummaries.injunctive.sd, 2)}</p>
                <p>
                  High approval (4–5): {normSummaries.injunctive.positiveShare != null
                    ? formatPercentage(normSummaries.injunctive.positiveShare * 100)
                    : "n/a"}
                </p>
                {normSummaries.injunctive.topValue != null ? (
                  <p>
                    Most common rating: {normSummaries.injunctive.topValue}
                    {normSummaries.injunctive.topShare != null
                      ? ` (${formatPercentage(normSummaries.injunctive.topShare * 100)})`
                      : ""}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Valid responses: {formatNumber(normSummaries.injunctive.count, { maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {(() => {
          const opportunityQuadrant = quadrants
            .filter((quadrant) => (quadrant.avgAbility ?? 0) < 3)
            .sort((a, b) => b.count - a.count)[0] ?? quadrants[0];
          const momentumQuadrant = quadrants
            .filter((quadrant) => (quadrant.avgMotivation ?? 0) >= 3 && (quadrant.avgAbility ?? 0) >= 3)
            .sort((a, b) => (b.currentUseRate ?? 0) - (a.currentUseRate ?? 0))[0] ?? quadrants[0];

          return (
            <>
              <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-chart-2 to-chart-2/70 shadow-md">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Opportunity Segment</CardTitle>
                      <CardDescription>Largest group with ability barriers</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">{opportunityQuadrant.label}</span> accounts for
                    {" "}{formatNumber(opportunityQuadrant.count)} respondents
                    ({formatPercentage(opportunityQuadrant.percentage)}). Average ability is
                    {" "}{formatAverage(opportunityQuadrant.avgAbility)} with a current use rate of
                    {" "}{opportunityQuadrant.currentUseRate == null
                      ? "n/a"
                      : formatPercentage(opportunityQuadrant.currentUseRate * 100)}.
                  </p>
                  <p>
                    Focus on facilitator prompts and system improvements to unlock this group. Remove logistical barriers while
                    maintaining the motivation already present.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-quadrant-high-m-high-a to-quadrant-high-m-high-a/70 shadow-md">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Momentum Segment</CardTitle>
                      <CardDescription>Where prompts can reinforce success</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">{momentumQuadrant.label}</span> shows the highest current use
                    rate at {momentumQuadrant.currentUseRate == null ? "n/a" : formatPercentage(momentumQuadrant.currentUseRate * 100)}
                    with motivation averaging {formatAverage(momentumQuadrant.avgMotivation)}. Maintain behaviour with light-touch signal prompts and peer-led storytelling.
                  </p>
                  <p>
                    Monitor this cohort as an early indicator of system performance—declines often appear here first when
                    service quality dips.
                  </p>
                </CardContent>
              </Card>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default DashboardOverview;
