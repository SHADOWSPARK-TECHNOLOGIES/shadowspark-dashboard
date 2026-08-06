import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Sparkline({ data, tone = "primary" }: { data: number[]; tone?: "primary" | "success" }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const points = data
    .map((value, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * 100;
      const y = 30 - ((value - min) / Math.max(max - min, 1)) * 26;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-9 w-full">
      <polyline
        points={points}
        fill="none"
        strokeWidth="2"
        className={tone === "primary" ? "stroke-primary" : "stroke-success"}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ProgressRing({
  value,
  size = 68,
}: {
  value: number;
  size?: number;
}) {
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  const stroke =
    value >= 90 ? "stroke-success" : value >= 70 ? "stroke-primary" : "stroke-destructive";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="6"
          fill="none"
          className="stroke-elevated"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={stroke}
        />
      </svg>
      <span className="num absolute inset-0 flex items-center justify-center text-sm font-semibold">
        {value}%
      </span>
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendTone = "success",
  subtitle,
  spark,
  right,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  trend?: string;
  trendTone?: "success" | "warning" | "danger";
  subtitle?: ReactNode;
  spark?: number[];
  right?: ReactNode;
  className?: string;
}) {
  const trendClass =
    trendTone === "success"
      ? "border-success/30 bg-success/12 text-success"
      : trendTone === "warning"
        ? "border-warning/30 bg-warning/12 text-warning"
        : "border-destructive/30 bg-destructive/12 text-destructive";

  return (
    <Card
      className={cn(
        "gap-0 rounded-xl border-border bg-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/30",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="grid size-8 place-items-center rounded-lg bg-elevated text-primary">
            {icon}
          </span>
          <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
        </div>
        {trend ? (
          <span className={cn("rounded-md border px-1.5 py-0.5 text-[11px] font-medium", trendClass)}>
            {trend}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="num text-2xl leading-none font-semibold sm:text-3xl">{value}</p>
          {subtitle ? <div className="mt-2 text-xs text-muted-foreground">{subtitle}</div> : null}
        </div>
        {right}
      </div>
      {spark ? (
        <div className="mt-3">
          <Sparkline data={spark} />
        </div>
      ) : null}
    </Card>
  );
}
