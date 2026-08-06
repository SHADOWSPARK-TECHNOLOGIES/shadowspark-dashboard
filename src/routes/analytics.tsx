import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  approvalSplit,
  channelUsage,
  kycProcessingTime,
  loanVolumeTrend,
  repaymentPerformance,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — ShadowSpark" },
      {
        name: "description",
        content:
          "Loan volume, approval rates, repayment performance, KYC processing time and channel usage analytics.",
      },
      { property: "og:title", content: "Analytics — ShadowSpark" },
      {
        property: "og:description",
        content: "Portfolio and operations analytics for African lenders.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const ranges = ["Today", "7 Days", "30 Days", "90 Days", "Custom"];
const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "12px",
  color: "var(--foreground)",
};

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-xl border-border bg-card p-5 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children as never}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function AnalyticsPage() {
  const [range, setRange] = useState("30 Days");

  return (
    <AppShell
      title="Analytics"
      breadcrumb="ShadowSpark / Analytics"
      actions={
        <Button size="sm" onClick={() => toast.success("PDF report queued")}>
          <Download className="size-4" />
          <span className="hidden sm:inline">Download PDF Report</span>
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {ranges.map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                range === item
                  ? "border-primary/40 bg-primary/12 text-primary"
                  : "border-border text-muted-foreground hover:bg-elevated",
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Loan Volume Trend"
            subtitle="Disbursed value, last 30 days"
            className="xl:col-span-2"
          >
            <AreaChart data={loanVolumeTrend}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} interval={4} />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickFormatter={(value: number) => `${(value / 1_000_000).toFixed(1)}M`}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.18}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartCard>

          <ChartCard title="Approval vs Rejection" subtitle="Decision split this period">
            <PieChart>
              <Tooltip contentStyle={tooltipStyle} />
              <Pie
                data={approvalSplit}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={92}
                paddingAngle={3}
              >
                {approvalSplit.map((entry, index) => (
                  <Cell key={entry.key} fill={palette[index % palette.length]} stroke="var(--card)" />
                ))}
              </Pie>
            </PieChart>
          </ChartCard>

          <ChartCard title="Repayment Performance" subtitle="On-time vs late vs defaulted">
            <BarChart data={repaymentPerformance}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="bucket" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="onTime" stackId="a" fill="var(--chart-2)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="late" stackId="a" fill="var(--chart-1)" />
              <Bar dataKey="defaulted" stackId="a" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard title="KYC Processing Time" subtitle="Average hours to decision">
            <LineChart data={kycProcessingTime}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartCard>

          <ChartCard title="Channel Usage" subtitle="Messages sent by channel">
            <PieChart>
              <Tooltip contentStyle={tooltipStyle} />
              <Pie data={channelUsage} dataKey="value" nameKey="name" outerRadius={92}>
                {channelUsage.map((entry, index) => (
                  <Cell key={entry.name} fill={palette[index % palette.length]} stroke="var(--card)" />
                ))}
              </Pie>
            </PieChart>
          </ChartCard>
        </div>
      </div>
    </AppShell>
  );
}
