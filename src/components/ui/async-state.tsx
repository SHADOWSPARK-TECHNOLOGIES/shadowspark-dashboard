import type { ReactNode } from "react";
import { AlertCircle, FolderOpen, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AsyncError({
  title = "Unable to load data",
  message,
  onRetry,
  retryLabel = "Retry",
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      {message ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      ) : null}
      {onRetry ? (
        <Button className="mt-4" size="sm" onClick={onRetry}>
          <RefreshCcw className="mr-1.5 size-3.5" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function AsyncEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-10 text-center">
      <div className="relative grid size-12 place-items-center rounded-2xl border border-border bg-elevated/60 text-muted-foreground">
        <FolderOpen className="size-6" />
        <span className="absolute -right-1 -bottom-1 size-2.5 rounded-full bg-primary/70" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function AsyncLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function AsyncSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-10 text-center">
      <Loader2 className="size-8 animate-spin text-primary" />
      {label ? <p className="mt-3 text-sm text-muted-foreground">{label}</p> : null}
    </div>
  );
}
