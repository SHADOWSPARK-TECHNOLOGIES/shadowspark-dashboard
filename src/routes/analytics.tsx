import { useMemo, useState, type ReactNode } from "react";
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
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversationsQuery, useLoansQuery, usePendingKycQuery } from "@/lib/backend-api";
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
  children: ReactNode;
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

function ChartSkeleton() {
  return (
    <Card className="gap-0 rounded-xl border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="mt-2 h-3 w-56" />
      <Skeleton className="mt-4 h-64 w-full" />
    </Card>
  );
}

function AnalyticsPage() {
  const [range, setRange] = useState("30 Days");
  const loansQuery = useLoansQuery();
  const kycQuery = usePendingKycQuery();
  const conversationsQuery = useConversationsQuery();

  const isLoading = loansQuery.isPending || kycQuery.isPending || conversationsQuery.isPending;
  const isError = loansQuery.isError || kycQuery.isError || conversationsQuery.isError;
  const errorMessage =
    (loansQuery.error instanceof Error && loansQuery.error.message) ||
    (kycQuery.error instanceof Error && kycQuery.error.message) ||
    (conversationsQuery.error instanceof Error && conversationsQuery.error.message) ||
    "Failed to load analytics data";

  const totalLoans = loansQuery.data?.data ?? [];
  const totalKycDocs = kycQuery.data ?? [];
  const totalConversations = conversationsQuery.data ?? [];

  const hasData = totalLoans.length > 0 || totalKycDocs.length > 0 || totalConversations.length > 0;

  const loanVolumeTrend = useMemo(() => {
    const grouped = new Map<string, { label: string; volume: number; count: number }>();
    for (const loan of totalLoans) {
      const date = new Date(loan.createdAt);
      const dayKey = date.toISOString().slice(0, 10);
      const prev = grouped.get(dayKey) ?? {
        label: date.toLocaleDateString("en-NG", { day: "2-digit", month: "short" }),
        volume: 0,
        count: 0,
      };
      prev.volume += Number(loan.loanAmount);
      prev.count += 1;
      grouped.set(dayKey, prev);
    }
    return Array.from(grouped.entries())
      .map(([day, metrics]) => ({ day, ...metrics }))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-30);
  }, [totalLoans]);

  const approvalSplit = useMemo(() => {
    const approved = totalLoans.filter((loan) => loan.status === "APPROVED" || loan.status === "DISBURSED").length;
    const rejected = totalLoans.filter((loan) => loan.status === "REJECTED").length;
    const inReview = totalLoans.length - approved - rejected;
    return [
      { name: "Approved", value: approved, key: "approved" },
      { name: "Rejected", value: rejected, key: "rejected" },
      { name: "In review", value: Math.max(inReview, 0), key: "review" },
    ];
  }, [totalLoans]);

  const repaymentPerformance = useMemo(() => {
    const buckets = [
      { bucket: "Submitted", onTime: 0, late: 0, defaulted: 0 },
      { bucket: "Approved", onTime: 0, late: 0, defaulted: 0 },
      { bucket: "Disbursed", onTime: 0, late: 0, defaulted: 0 },
      { bucket: "Closed", onTime: 0, late: 0, defaulted: 0 },
    ];
    for (const loan of totalLoans) {
      if (loan.status === "SUBMITTED" || loan.status === "KYC_PENDING" || loan.status === "CREDIT_CHECK") {
        buckets[0]!.late += 1;
      } else if (loan.status === "APPROVED") {
        buckets[1]!.onTime += 1;
      } else if (loan.status === "DISBURSED") {
        buckets[2]!.onTime += 1;
      } else if (loan.status === "DEFAULTED") {
        buckets[2]!.defaulted += 1;
      } else if (loan.status === "CLOSED") {
        buckets[3]!.onTime += 1;
      }
    }
    return buckets;
  }, [totalLoans]);

  const kycProcessingTime = useMemo(() => {
    return totalKycDocs
      .map((doc) => ({
        day: new Date(doc.createdAt ?? new Date().toISOString()).toLocaleDateString("en-NG", {
          weekday: "short",
        }),
        hours:
          doc.reviewedAt && doc.createdAt
            ? Math.max((Date.parse(doc.reviewedAt) - Date.parse(doc.createdAt)) / 3_600_000, 0)
            : 0,
      }))
      .slice(-14);
  }, [totalKycDocs]);

  const channelUsage = useMemo(() => {
    const byChannel = new Map<string, number>();
    for (const convo of totalConversations) {
      byChannel.set(convo.channel, (byChannel.get(convo.channel) ?? 0) + 1);
    }
    return Array.from(byChannel.entries()).map(([name, value]) => ({ name, value }));
  }, [totalConversations]);

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

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => {
                void loansQuery.refetch();
                void kycQuery.refetch();
                void conversationsQuery.refetch();
              }}
            >
              Retry
            </Button>
          </div>
        ) : !hasData ? (
          <EmptyState title="No analytics data" description="Data will appear after backend activity." />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard
              title="Loan Volume Trend"
              subtitle="Disbursed value, last 30 entries"
              className="xl:col-span-2"
            >
              <AreaChart data={loanVolumeTrend}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} interval={4} />
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

            <ChartCard title="Repayment Performance" subtitle="Status distribution across portfolio">
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

            <ChartCard title="Channel Usage" subtitle="Conversations by channel">
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
        )}
      </div>
    </AppShell>
  );
}
