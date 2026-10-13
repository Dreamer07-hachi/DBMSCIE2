import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { ChartDatum } from "@/types/common";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "./States";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

export interface ChartCardProps {
  title: string;
  description?: string;
  type: "bar" | "line" | "area" | "pie" | "stacked";
  data?: ChartDatum[];
  xKey: string;
  series: { key: string; label: string }[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  height?: number;
  valueFormatter?: (v: number) => string;
}

export function ChartCard({ title, description, type, data, xKey, series, loading, error, onRetry, height = 260, valueFormatter }: ChartCardProps) {
  const tick = { fontSize: 11, fill: "var(--muted-foreground)" };
  const fmt = (v: unknown) => (valueFormatter && typeof v === "number" ? valueFormatter(v) : String(v));
  const tooltip = <Tooltip formatter={fmt} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />;
  return (
    <div className="min-w-0 rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="mt-3" style={{ height }}>
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : error ? (
          <ErrorState onRetry={onRetry} />
        ) : !data?.length ? (
          <EmptyState title="No chart data" description="Nothing to display for this period." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {type === "pie" ? (
              <PieChart>
                <Pie data={data} dataKey={series[0]?.key ?? "value"} nameKey={xKey} innerRadius="50%" outerRadius="80%" paddingAngle={2}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                {tooltip}
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            ) : type === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey={xKey} tick={tick} /><YAxis tick={tick} width={44} tickFormatter={(v) => fmt(v)} />
                {tooltip}
                {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
                {series.map((s, i) => <Line key={s.key} dataKey={s.key} name={s.label} stroke={COLORS[i]} strokeWidth={2} dot={false} />)}
              </LineChart>
            ) : type === "area" ? (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey={xKey} tick={tick} /><YAxis tick={tick} width={44} tickFormatter={(v) => fmt(v)} />
                {tooltip}
                {series.map((s, i) => <Area key={s.key} dataKey={s.key} name={s.label} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />)}
              </AreaChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey={xKey} tick={tick} interval={0} angle={data.length > 6 ? -25 : 0} textAnchor={data.length > 6 ? "end" : "middle"} height={data.length > 6 ? 50 : 30} />
                <YAxis tick={tick} width={44} tickFormatter={(v) => fmt(v)} />
                {tooltip}
                {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
                {series.map((s, i) => (
                  <Bar key={s.key} dataKey={s.key} name={s.label} fill={COLORS[i]} radius={type === "stacked" ? 0 : [4, 4, 0, 0]} stackId={type === "stacked" ? "a" : undefined} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
