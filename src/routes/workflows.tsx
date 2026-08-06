import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  Clock,
  GitBranch,
  MessageSquare,
  Play,
  Plus,
  Save,
  Send,
  Split,
  Upload,
  Zap,
  CircleStop,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { relativeTime } from "@/lib/format";
import { workflows } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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

type NodeKind = "trigger" | "action" | "condition" | "end";

const kindStyle: Record<NodeKind, string> = {
  trigger: "border-info/60 bg-info/8",
  action: "border-primary/60 bg-primary/8",
  condition: "border-purple/60 bg-purple/8",
  end: "border-border bg-elevated/60",
};

const canvasNodes: { id: string; kind: NodeKind; label: string; x: number; y: number }[] = [
  { id: "n1", kind: "trigger", label: "Loan Submitted", x: 40, y: 60 },
  { id: "n2", kind: "action", label: "Send WhatsApp: KYC request", x: 300, y: 60 },
  { id: "n3", kind: "condition", label: "KYC Verified?", x: 300, y: 190 },
  { id: "n4", kind: "condition", label: "Amount > ₦100K?", x: 570, y: 130 },
  { id: "n5", kind: "action", label: "Update Loan Status", x: 570, y: 260 },
  { id: "n6", kind: "end", label: "Escalate to Human", x: 830, y: 200 },
];

const edges = [
  ["n1", "n2"],
  ["n2", "n3"],
  ["n3", "n4"],
  ["n3", "n5"],
  ["n4", "n6"],
  ["n5", "n6"],
];

const palette: { kind: NodeKind; label: string; icon: typeof Zap }[] = [
  { kind: "trigger", label: "Loan Submitted", icon: Zap },
  { kind: "trigger", label: "Message Received", icon: MessageSquare },
  { kind: "trigger", label: "Schedule", icon: Clock },
  { kind: "action", label: "Send WhatsApp", icon: Send },
  { kind: "action", label: "Update Loan Status", icon: Upload },
  { kind: "action", label: "Wait", icon: Clock },
  { kind: "condition", label: "KYC Verified?", icon: Split },
  { kind: "condition", label: "Credit Score > 600?", icon: Split },
  { kind: "end", label: "Escalate to Human", icon: Bot },
  { kind: "end", label: "Complete", icon: CircleStop },
];

function nodeCenter(id: string) {
  const node = canvasNodes.find((item) => item.id === id)!;
  return { x: node.x + 200, y: node.y + 26 };
}

function Builder({ onBack, name }: { onBack: () => void; name: string }) {
  const [workflowName, setWorkflowName] = useState(name);
  const [selected, setSelected] = useState(canvasNodes[1]!.id);
  const node = canvasNodes.find((item) => item.id === selected)!;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          Back to list
        </Button>
        <Input
          value={workflowName}
          onChange={(event) => setWorkflowName(event.target.value)}
          className="h-9 w-full max-w-xs"
        />
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("Workflow saved")}>
            <Save className="size-4" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success("Test run started")}>
            <Play className="size-4" />
            Test
          </Button>
          <Button size="sm" onClick={() => toast.success(`${workflowName} published`)}>
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[200px_1fr_280px]">
        <Card className="gap-2 rounded-xl border-border bg-card p-3 shadow-[var(--shadow-card)]">
          <p className="px-1 text-[10px] tracking-wider text-subtle uppercase">Node palette</p>
          {palette.map((item) => (
            <div
              key={`${item.kind}-${item.label}`}
              draggable
              className={cn(
                "flex cursor-grab items-center gap-2 rounded-lg border px-2.5 py-2 text-xs",
                kindStyle[item.kind],
              )}
            >
              <item.icon className="size-3.5" />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </Card>

        <div className="canvas-grid scroll-slim relative h-[540px] overflow-auto rounded-xl border border-border bg-background">
          <div className="relative h-[420px] w-[1120px]">
            <svg className="absolute inset-0 h-full w-full">
              {edges.map(([from, to]) => {
                const a = nodeCenter(from!);
                const b = canvasNodes.find((item) => item.id === to)!;
                const bx = b.x;
                const by = b.y + 26;
                const d = `M ${a.x} ${a.y} C ${a.x + 60} ${a.y}, ${bx - 60} ${by}, ${bx} ${by}`;
                return (
                  <g key={`${from}-${to}`}>
                    <path d={d} className="stroke-border" strokeWidth="1.5" fill="none" />
                    <circle r="3" className="fill-primary">
                      <animateMotion dur="2.6s" repeatCount="indefinite" path={d} />
                    </circle>
                  </g>
                );
              })}
            </svg>

            {canvasNodes.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item.id)}
                style={{ left: item.x, top: item.y }}
                className={cn(
                  "absolute flex w-[200px] items-center gap-2 rounded-xl border px-3 py-3 text-left text-xs transition-shadow",
                  kindStyle[item.kind],
                  selected === item.id && "ring-2 ring-primary/50",
                )}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-card">
                  {item.kind === "trigger" ? (
                    <Zap className="size-3.5 text-info" />
                  ) : item.kind === "action" ? (
                    <Send className="size-3.5 text-primary" />
                  ) : item.kind === "condition" ? (
                    <Split className="size-3.5 text-purple" />
                  ) : (
                    <CircleStop className="size-3.5 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.label}</span>
                  <span className="block text-[10px] tracking-wider text-subtle uppercase">
                    {item.kind}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <Card className="gap-4 rounded-xl border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div>
            <p className="text-sm font-semibold">Node configuration</p>
            <p className="text-[11px] text-muted-foreground">{node.kind} node</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Label</Label>
              <Input defaultValue={node.label} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Template / expression</Label>
              <Input defaultValue="kyc_request_v3" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Retry attempts</Label>
              <Input defaultValue="3" className="num mt-1" />
            </div>
            <Button className="w-full" onClick={() => toast.success("Node updated")}>
              Apply changes
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function WorkflowsPage() {
  const [builderFor, setBuilderFor] = useState<string | null>(null);

  return (
    <AppShell
      title="Workflows"
      breadcrumb="ShadowSpark / Workflows"
      actions={
        <Button size="sm" onClick={() => setBuilderFor("Untitled workflow")}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Create Workflow</span>
        </Button>
      }
    >
      {builderFor ? (
        <Builder name={builderFor} onBack={() => setBuilderFor(null)} />
      ) : (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold">Automation workflows</h2>
            <p className="text-sm text-muted-foreground">
              Every lending decision path your agents run, in one place
            </p>
          </div>
          <div className="scroll-slim overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] tracking-wider text-muted-foreground uppercase">
                  <th className="px-5 py-3 text-left font-semibold">Name</th>
                  <th className="px-5 py-3 text-left font-semibold">Trigger</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Last run</th>
                  <th className="px-5 py-3 text-right font-semibold">Success rate</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((workflow) => (
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
                    <td className="px-5 py-3 text-muted-foreground">{workflow.trigger}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={workflow.status} />
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {relativeTime(workflow.lastRun)}
                    </td>
                    <td className="num px-5 py-3 text-right">{workflow.successRate}%</td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => setBuilderFor(workflow.name)}>
                        Open builder
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
