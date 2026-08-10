import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GitBranch, Play, Send, Split, Zap, CircleStop } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BackendWorkflowDetail } from "@/lib/backend-api";
import {
  useExecuteWorkflowMutation,
  useWorkflowDetailQuery,
  useWorkflowsQuery,
} from "@/hooks/use-workflows";

export const Route = createFileRoute("/workflows")({
  head: () => ({
    meta: [
      { title: "Workflow Builder — ShadowSpark" },
      {
        name: "description",
        content:
          "Design automation flows that trigger on loan events, route messages and escalate decisions to human officers.",
      },
      { property: "og:title", content: "Workflow Builder — ShadowSpark" },
      {
        property: "og:description",
        content: "Node-based automation builder for lending and KYC operations.",
      },
    ],
  }),
  component: WorkflowsPage,
});

const kindStyle: Record<string, string> = {
  start: "border-info/60 bg-info/8",
  trigger: "border-info/60 bg-info/8",
  task: "border-primary/60 bg-primary/8",
  action: "border-primary/60 bg-primary/8",
  condition: "border-purple/60 bg-purple/8",
  end: "border-border bg-elevated/60",
};

function nodeKind(type: string): string {
  if (type === "start") return "start";
  if (type === "task") return "task";
  if (type === "condition") return "condition";
  return "end";
}

function WorkflowDetail({
  workflow,
  onBack,
}: {
  workflow: BackendWorkflowDetail;
  onBack: () => void;
}) {
  const executeMutation = useExecuteWorkflowMutation();
  const nodes = workflow.nodes ?? [];
  const edges = workflow.edges ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          Back to list
        </Button>
        <h2 className="text-base font-semibold">{workflow.name}</h2>
        <StatusBadge status={workflow.isActive ? "ACTIVE" : "PAUSED"} />
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            disabled={executeMutation.isPending}
            onClick={() => executeMutation.mutate({ id: workflow.id })}
          >
            <Play className="size-4" />
            {executeMutation.isPending ? "Executing…" : "Execute"}
          </Button>
        </div>
      </div>

      {workflow.description ? (
        <p className="text-sm text-muted-foreground">{workflow.description}</p>
      ) : null}

      {nodes.length === 0 ? (
        <EmptyState
          title="No nodes defined"
          description="This workflow has no node graph on the backend yet."
        />
      ) : (
        <Card className="gap-3 rounded-xl border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-[10px] tracking-wider text-subtle uppercase">
            {nodes.length} nodes · {edges.length} edges
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {nodes.map((node) => {
              const kind = nodeKind(node.type);
              return (
                <div
                  key={node.id}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-3 text-xs",
                    kindStyle[kind],
                  )}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-card">
                    {kind === "start" ? (
                      <Zap className="size-3.5 text-info" />
                    ) : kind === "task" ? (
                      <Send className="size-3.5 text-primary" />
                    ) : kind === "condition" ? (
                      <Split className="size-3.5 text-purple" />
                    ) : (
                      <CircleStop className="size-3.5 text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{node.label ?? node.id}</span>
                    <span className="block text-[10px] tracking-wider text-subtle uppercase">
                      {node.type}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
          {edges.length > 0 ? (
            <ul className="space-y-1 text-[11px] text-muted-foreground">
              {edges.map((edge) => (
                <li key={edge.id} className="num">
                  {edge.source} → {edge.target}
                  {edge.condition ? ` (${edge.condition})` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      )}
    </div>
  );
}

function WorkflowsPage() {
  const workflowsQuery = useWorkflowsQuery();
  const executeMutation = useExecuteWorkflowMutation();
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailQuery = useWorkflowDetailQuery(detailId);

  const items = workflowsQuery.data ?? [];

  return (
    <AppShell title="Workflows" breadcrumb="ShadowSpark / Workflows">
      {detailId ? (
        detailQuery.isPending ? (
          <div className="space-y-2 rounded-xl border border-border bg-card p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : detailQuery.isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : "Failed to load workflow details"}
            </p>
            <Button className="mt-4" size="sm" onClick={() => detailQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : detailQuery.data ? (
          <WorkflowDetail workflow={detailQuery.data as BackendWorkflowDetail} onBack={() => setDetailId(null)} />
        ) : (
          <EmptyState
            title="Workflow unavailable"
            description="The selected workflow is no longer available on the backend."
            actionLabel="Back to list"
            onAction={() => setDetailId(null)}
          />
        )
      ) : (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold">Automation workflows</h2>
            <p className="text-sm text-muted-foreground">
              Every lending decision path your agents run, in one place
            </p>
          </div>

          {workflowsQuery.isPending ? (
            <div className="space-y-2 rounded-xl border border-border bg-card p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : workflowsQuery.isError ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {workflowsQuery.error instanceof Error
                  ? workflowsQuery.error.message
                  : "Failed to load workflows"}
              </p>
              <Button className="mt-4" size="sm" onClick={() => workflowsQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="No workflows yet"
              description="Automation workflows created on the backend will appear here."
            />
          ) : (
            <div className="scroll-slim overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] tracking-wider text-muted-foreground uppercase">
                    <th className="px-5 py-3 text-left font-semibold">Name</th>
                    <th className="px-5 py-3 text-left font-semibold">Description</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-left font-semibold">Created</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((workflow) => (
                    <tr
                      key={workflow.id}
                      className="border-b border-border/60 transition-colors last:border-0 hover:bg-elevated/60"
                    >
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 font-medium">
                          <GitBranch className="size-4 text-primary" />
                          {workflow.name}
                        </span>
                      </td>
                      <td className="max-w-[260px] truncate px-5 py-3 text-muted-foreground">
                        {workflow.description ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={workflow.isActive ? "ACTIVE" : "PAUSED"} />
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {relativeTime(workflow.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDetailId(workflow.id)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            disabled={executeMutation.isPending}
                            onClick={() => executeMutation.mutate({ id: workflow.id })}
                          >
                            <Play className="size-4" />
                            Execute
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
