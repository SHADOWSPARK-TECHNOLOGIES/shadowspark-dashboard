import { cn } from "@/lib/utils";

type Tone = "slate" | "info" | "warning" | "primary" | "success" | "danger" | "purple" | "outline";

const toneClasses: Record<Tone, string> = {
  slate: "border-border bg-elevated/70 text-muted-foreground",
  info: "border-info/30 bg-info/12 text-info",
  warning: "border-warning/30 bg-warning/12 text-warning",
  primary: "border-primary/30 bg-primary/12 text-primary",
  success: "border-success/30 bg-success/12 text-success",
  danger: "border-destructive/30 bg-destructive/12 text-destructive",
  purple: "border-purple/30 bg-purple/12 text-purple",
  outline: "border-success/60 bg-transparent text-success",
};

const dotClasses: Record<Tone, string> = {
  slate: "bg-subtle",
  info: "bg-info",
  warning: "bg-warning",
  primary: "bg-primary",
  success: "bg-success",
  danger: "bg-destructive",
  purple: "bg-purple",
  outline: "bg-success",
};

const statusTone: Record<string, Tone> = {
  DRAFT: "slate",
  SUBMITTED: "info",
  KYC_PENDING: "warning",
  KYC_VERIFIED: "info",
  CREDIT_CHECK: "purple",
  APPROVED: "success",
  REJECTED: "danger",
  DISBURSED: "outline",
  DEFAULTED: "danger",
  CLOSED: "slate",
  PENDING: "warning",
  VERIFIED: "success",
  EXPIRED: "slate",
  PAID: "success",
  PARTIAL: "info",
  OVERDUE: "danger",
  WAIVED: "slate",
  ACTIVE: "success",
  PAUSED: "warning",
  QUEUED: "slate",
  SENT: "info",
  DELIVERED: "success",
  READ: "success",
  FAILED: "danger",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const tone = statusTone[status] ?? "slate";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        toneClasses[tone],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dotClasses[tone])} />
      {status.replace(/_/g, " ")}
    </span>
  );
}
