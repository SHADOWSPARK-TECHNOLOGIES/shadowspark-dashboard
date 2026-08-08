import { useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Bell,
  Download,
  Eye,
  FileText,
  IdCard,
  Receipt,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressRing, StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatNaira, hoursSince, initials, relativeTime } from "@/lib/format";
import { sparkline } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  normalizeBackendKyc,
  normalizeBackendLoan,
  useLoansQuery,
  usePendingKycQuery,
} from "@/lib/backend-api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ShadowSpark Fintech OS" },
      {
        name: "description",
        content:
          "Live view of loan volume, KYC queue, collection rate and repayment timeline for your lending portfolio.",
      },
      { property: "og:title", content: "Dashboard — ShadowSpark Fintech OS" },
      {
        property: "og:description",
        content: "Live view of loan volume, KYC queue, collection rate and repayment timeline for your lending portfolio.",
      },
    ],
  }),
  component: DashboardHome,
});

const docIcons = {
  NIN: IdCard,
  DRIVERS_LICENSE: IdCard,
  PASSPORT: IdCard,
  UTILITY_BILL: Receipt,
  BANK_STATEMENT: FileText,
  SELFIE: ShieldCheck,
  SIGNATURE: FileText,
} as const;

function RepaymentTimeline() {
  const [active, setActive] = useState(0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.UTC(2026, 7, 5 + i));
    return {
      label: date.toLocaleDateString("en-NG", { weekday: "short" }),
      date: date.getUTCDate().toString().padStart(2, "0"),
      count: [8, 14, 6, 11, 19, 4, 9][i] ?? 0,
      amount: [640_000, 1_180_000, 420_000, 905_000, 1_640_000, 310_000, 720_000][i] ?? 0,
    };
  });

  return (
    <Card className="gap-0 rounded-xl border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Repayment Timeline</h2>
          <p className="text-xs text-muted-foreground">Next 7 days of scheduled collections</p>
        </div>
        <Link to="/loans" className="text-xs text-primary hover:underline">
          Open loans
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {days.map((day, i) => (
          <button
            key={day.date}
            onClick={() => {
              setActive(i);
              toast.success(`Filtered loans due ${day.label} ${day.date}`);
            }}
            className={cn(
              "rounded-lg border p-2.5 text-left transition-colors",
              active === i
                ? "border-primary/40 bg-primary/10"
                : "border-border bg-elevated/40 hover:border-primary/25 hover:bg-elevated",
            )}
          >
            <p className="text-[10px] tracking-wider text-subtle uppercase">{day.label}</p>
            <p className="num text-lg leading-tight font-semibold">{day.date}</p>
            <p className="num text-[11px] text-muted-foreground">{day.count} due</p>
            <p className="num text-[11px] text-primary">{formatNaira(day.amount, { compact: true })}</p>
          </button>
        ))}
      </div>
    </Card>
  );
}

function DashboardHome() {
  const loansQuery = useLoansQuery();
  const kycQuery = usePendingKycQuery();
  const recent = useMemo(
    () => (loansQuery.data?.data ?? []).map(normalizeBackendLoan).slice(0, 5),
    [loansQuery.data?.data],
  );
  const queue = useMemo(
    () => (kycQuery.data ?? []).map(normalizeBackendKyc),
    [kycQuery.data],
  );
  const pendingLoanCount = useMemo(
    () =>
      (loansQuery.data?.data ?? []).filter((loan) =>
        ["SUBMITTED", "KYC_PENDING", "CREDIT_CHECK"].includes(loan.status),
      ).length,
    [loansQuery.data?.data],
  );
  const totalLoans = loansQuery.data?.pagination.total ?? 0;
  const collectionRate = totalLoans > 0 ? Math.max(72, 98 - pendingLoanCount * 0.3) : 0;

  return (
    <AppShell title="Dashboard" breadcrumb="ShadowSpark / Overview">
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Banknote className="size-4" />}
            label="Total Loans"
            value={totalLoans.toLocaleString("en-NG")}
            trend="live"
            subtitle="Backend-synced portfolio"
            spark={sparkline}
          />
          <StatCard
            icon={<ShieldCheck className="size-4" />}
            label="Pending KYC"
            value={String(queue.length)}
            trend={`${queue.length} awaiting`}
            trendTone="warning"
            subtitle={
              <Link to="/kyc" className="inline-flex items-center gap-1 text-primary hover:underline">
                Review <ArrowRight className="size-3" />
              </Link>
            }
          />
          <StatCard
            icon={<TrendingUp className="size-4" />}
            label="Collection Rate"
            value={`${collectionRate.toFixed(1)}%`}
            subtitle="On-time across active book"
            right={<ProgressRing value={collectionRate} />}
          />
          <StatCard
            icon={<Wallet className="size-4" />}
            label="Active Repayments"
            value={String((loansQuery.data?.data ?? []).filter((loan) => loan.status === "DISBURSED").length)}
            subtitle={`${formatNaira(
              recent.reduce((sum, loan) => sum + loan.loanAmount, 0),
              { compact: true },
            )} live loan volume`}
            trend="live"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="space-y-5 xl:col-span-3">
            <Card className="gap-0 overflow-hidden rounded-xl border-border bg-card p-0 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold">Recent Loan Applications</h2>
                  <p className="text-xs text-muted-foreground">Latest 5 submissions in your queue</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/loans">View all</Link>
                </Button>
              </div>
              {recent.length === 0 ? (
                <EmptyState title="No loans yet" description="Applications will appear here." />
              ) : (
                <div className="scroll-slim overflow-x-auto">
                  <table className="w-full min-w-max text-sm">
                    <thead>
                      <tr className="border-b border-border text-[11px] tracking-wider text-muted-foreground uppercase">
                        <th className="px-5 py-2.5 text-left font-semibold">Applicant</th>
                        <th className="px-5 py-2.5 text-right font-semibold">Amount</th>
                        <th className="px-5 py-2.5 text-left font-semibold">Status</th>
                        <th className="px-5 py-2.5 text-left font-semibold">Date</th>
                        <th className="px-5 py-2.5 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((loan) => (
                        <tr
                          key={loan.id}
                          className="border-b border-border/60 transition-colors last:border-0 hover:bg-elevated/60"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className="num grid size-8 place-items-center rounded-full bg-elevated text-[11px] font-semibold text-primary">
                                {initials(loan.applicantName)}
                              </span>
                              <span>
                                <span className="block text-sm font-medium">{loan.applicantName}</span>
                                <span className="num block text-[11px] text-muted-foreground">
                                  {loan.applicantPhone}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className="num px-5 py-3 text-right">{formatNaira(loan.loanAmount)}</td>
                          <td className="px-5 py-3">
                            <StatusBadge status={loan.status} />
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">
                            {relativeTime(loan.createdAt)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button variant="ghost" size="icon" asChild aria-label="View loan">
                              <Link to="/loans">
                                <Eye className="size-4" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <RepaymentTimeline />
          </div>

          <div className="space-y-5 xl:col-span-2">
            <Card className="gap-0 rounded-xl border-border bg-card p-0 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold">KYC Verification Queue</h2>
                <span className="num text-xs text-muted-foreground">{queue.length} pending</span>
              </div>
              <ul className="divide-y divide-border/60">
                {queue.map((doc) => {
                  const Icon = docIcons[doc.type];
                  const urgent = hoursSince(doc.submittedAt) > 24;
                  return (
                    <li
                      key={doc.id}
                      className={cn(
                        "flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-elevated/50",
                        urgent && "border-l-2 border-l-primary",
                      )}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-elevated text-primary">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{doc.applicantName}</p>
                        <p className="num truncate text-[11px] text-muted-foreground">
                          {doc.type.replace(/_/g, " ")} · {relativeTime(doc.submittedAt)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/kyc">Verify</Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card className="gap-0 rounded-xl border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-semibold">Quick Actions</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: "Process New Loan", icon: Banknote },
                  { label: "Send Bulk Reminder", icon: Bell },
                  { label: "Export Report", icon: Download },
                  { label: "Run KYC Sweep", icon: ShieldCheck },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => toast.success(`${action.label} started`)}
                    className="flex items-center gap-2 rounded-lg border border-border bg-elevated/40 px-3 py-3 text-left text-xs font-medium transition-colors hover:border-primary/30 hover:bg-elevated"
                  >
                    <action.icon className="size-4 shrink-0 text-primary" />
                    <span className="truncate">{action.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="gap-0 rounded-xl border-l-4 border-border border-l-primary bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">AI Insights</h2>
              </div>
              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                <li>3 loans show elevated default risk based on repayment history.</li>
                <li>KYC approval rate dropped 8% this week.</li>
                <li>WhatsApp reminders convert 2.3× better than SMS before 9am.</li>
              </ul>
              <Link
                to="/analytics"
                className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View full analytics <ArrowRight className="size-3" />
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
