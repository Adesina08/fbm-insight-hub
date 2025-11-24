import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryDistributionChartProps {
  title: string;
  subtitle?: string;
  data?: { label: string; count: number }[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export const CategoryDistributionChart = ({
  title,
  subtitle,
  data,
  isLoading,
  emptyMessage = "No data available to plot this distribution.",
}: CategoryDistributionChartProps) => {
  const safeData = data ?? [];
  const showEmpty = !isLoading && safeData.length === 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent className="h-[320px]">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : showEmpty ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={safeData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" angle={-20} textAnchor="end" height={60} interval={0} tickLine={false} />
              <YAxis allowDecimals={false} tickLine={false} />
              <Tooltip formatter={(value: number) => value.toLocaleString()} />
              <Bar dataKey="count" name="Respondents" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

interface LikertDistributionChartProps {
  title: string;
  subtitle?: string;
  data?: { bucket: string; count: number }[];
  isLoading?: boolean;
}

export const LikertDistributionChart = ({
  title,
  subtitle,
  data,
  isLoading,
}: LikertDistributionChartProps) => {
  const safeData = data ?? [];
  const showEmpty = !isLoading && safeData.length === 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent className="h-[320px]">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : showEmpty ? (
          <p className="text-sm text-muted-foreground">No responses recorded for this scale.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={safeData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" angle={-15} textAnchor="end" height={50} interval={0} tickLine={false} />
              <YAxis allowDecimals={false} tickLine={false} />
              <Tooltip formatter={(value: number) => value.toLocaleString()} />
              <Bar dataKey="count" name="Responses" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

interface CrossTabUseChartProps {
  title: string;
  subtitle?: string;
  data?: { category: string; low: number | null; high: number | null }[];
  isLoading?: boolean;
}

export const CrossTabUseChart = ({ title, subtitle, data, isLoading }: CrossTabUseChartProps) => {
  const safeData = (data ?? []).map((item) => ({
    ...item,
    low: item.low ?? 0,
    high: item.high ?? 0,
  }));
  const showEmpty = !isLoading && safeData.length === 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent className="h-[320px]">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : showEmpty ? (
          <p className="text-sm text-muted-foreground">Not enough data to build these cross-tabulations yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={safeData} margin={{ top: 8, right: 16, left: 0, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" height={60} angle={-12} textAnchor="end" interval={0} tickLine={false} />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tickLine={false} />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="low" name="Low" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="high" name="High" fill="var(--chart-5)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
