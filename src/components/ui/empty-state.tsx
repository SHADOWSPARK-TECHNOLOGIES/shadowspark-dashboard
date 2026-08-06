import type { ReactNode } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="relative grid size-16 place-items-center rounded-2xl border border-border bg-elevated/60 text-muted-foreground">
        {icon ?? <FolderOpen className="size-7" />}
        <span className="absolute -right-1 -bottom-1 size-3 rounded-full bg-primary/70" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {actionLabel ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
