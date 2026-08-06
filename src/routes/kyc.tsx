import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Flag, HelpCircle, IdCard, Receipt, ShieldCheck, X, FileText } from "lucide-react";
import { toast } from "sonner";
import type { KycDocument, KycStatus } from "@/types";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DocumentViewer } from "@/components/ui/document-viewer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { hoursSince, initials, relativeTime } from "@/lib/format";
import { kycDocuments } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/kyc")({
  head: () => ({
    meta: [
      { title: "KYC Verification Center — ShadowSpark" },
      {
        name: "description",
        content:
          "Review, verify and reject applicant identity documents with OCR extraction and a drag-and-drop review board.",
      },
      { property: "og:title", content: "KYC Verification Center — ShadowSpark" },
      {
        property: "og:description",
        content: "Identity document review board with OCR extraction and audit trail.",
      },
    ],
  }),
  component: KycPage,
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

const columnsConfig: { key: KycStatus; title: string; accent: string }[] = [
  { key: "PENDING", title: "Pending Review", accent: "bg-warning" },
  { key: "VERIFIED", title: "Verified", accent: "bg-success" },
  { key: "REJECTED", title: "Rejected", accent: "bg-destructive" },
];

function KycPage() {
  const [docs, setDocs] = useState<KycDocument[]>(kycDocuments);
  const [active, setActive] = useState<KycDocument | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  function move(id: string, status: KycStatus) {
    setDocs((prev) => prev.map((doc) => (doc.id === id ? { ...doc, status } : doc)));
    toast.success(`${id} moved to ${status.toLowerCase()}`);
  }

  const stats = [
    { label: "Pending", value: docs.filter((d) => d.status === "PENDING").length, tone: "text-warning" },
    { label: "Verified today", value: 18, tone: "text-success" },
    { label: "Rejected today", value: 3, tone: "text-destructive" },
  ];

  return (
    <AppShell title="KYC Verification Center" breadcrumb="ShadowSpark / KYC">
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">KYC Verification Center</h2>
            <p className="text-sm text-muted-foreground">
              Drag applicants between columns to record a decision
            </p>
          </div>
          <div className="flex gap-3">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="gap-0 rounded-xl border-border bg-card px-4 py-2.5 shadow-[var(--shadow-card)]"
              >
                <p className="text-[10px] tracking-wider text-subtle uppercase">{stat.label}</p>
                <p className={cn("num text-lg font-semibold", stat.tone)}>{stat.value}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {columnsConfig.map((column) => {
            const items = docs.filter((doc) => doc.status === column.key);
            return (
              <div
                key={column.key}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragged) move(dragged, column.key);
                  setDragged(null);
                }}
                className="flex min-h-[240px] flex-col rounded-xl border border-border bg-card/60 p-3"
              >
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={cn("size-2 rounded-full", column.accent)} />
                  <h3 className="text-sm font-semibold">{column.title}</h3>
                  <span className="num ml-auto text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2.5">
                  {items.map((doc) => {
                    const Icon = docIcons[doc.type];
                    const urgent = doc.status === "PENDING" && hoursSince(doc.submittedAt) > 24;
                    return (
                      <button
                        key={doc.id}
                        draggable
                        onDragStart={() => setDragged(doc.id)}
                        onClick={() => setActive(doc)}
                        className={cn(
                          "w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/35 hover:bg-elevated/60",
                          urgent && "border-l-2 border-l-primary",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="num grid size-9 shrink-0 place-items-center rounded-full bg-elevated text-[11px] font-semibold text-primary">
                            {initials(doc.applicantName)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{doc.applicantName}</p>
                            <p className="num truncate text-[11px] text-muted-foreground">
                              {doc.applicantPhone}
                            </p>
                          </div>
                          {urgent ? <Flag className="size-3.5 shrink-0 text-primary" /> : null}
                        </div>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Icon className="size-3.5 text-primary" />
                            {doc.type.replace(/_/g, " ")}
                          </span>
                          <span className="num text-[10px] text-subtle">
                            {relativeTime(doc.submittedAt)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {items.length === 0 ? (
                    <p className="px-1 py-6 text-center text-xs text-subtle">Nothing here</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={Boolean(active)} onOpenChange={(open) => (!open ? setActive(null) : undefined)}>
        <DialogContent className="flex h-[88vh] max-w-6xl flex-col gap-0 border-border bg-card p-0 shadow-[var(--shadow-panel)]">
          {active ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <DialogTitle className="text-base">{active.applicantName}</DialogTitle>
                  <p className="num text-xs text-muted-foreground">
                    {active.applicantPhone} · {active.type.replace(/_/g, " ")}
                  </p>
                </div>
                <StatusBadge status={active.status} />
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-5">
                <div className="flex min-h-[280px] flex-col p-4 lg:col-span-3">
                  <DocumentViewer label={`${active.id} · ${active.type.replace(/_/g, " ")}`} />
                </div>

                <div className="scroll-slim min-h-0 space-y-5 overflow-y-auto border-t border-border p-5 lg:col-span-2 lg:border-t-0 lg:border-l">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      OCR extracted data
                    </p>
                    <div className="mt-3 space-y-2.5">
                      {Object.entries(active.ocrData ?? {}).map(([key, value]) => (
                        <div key={key}>
                          <Label className="text-[10px] tracking-wider text-subtle uppercase">
                            {key}
                          </Label>
                          <Input defaultValue={value} className="mt-1 h-9 text-sm" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Verification checklist
                    </p>
                    <div className="mt-3 space-y-2.5">
                      {["ID Valid", "Photo Match", "Address Confirmed"].map((item) => (
                        <label key={item} className="flex items-center gap-2.5 text-sm">
                          <Checkbox />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Reviewer comment</Label>
                    <Textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Reason for rejection or additional information needed…"
                      className="mt-1 min-h-24"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Button
                      className="bg-success text-success-foreground hover:bg-success/90"
                      onClick={() => {
                        move(active.id, "VERIFIED");
                        setActive(null);
                      }}
                    >
                      <CheckCircle2 className="size-4" />
                      Verify &amp; Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        move(active.id, "REJECTED");
                        setActive(null);
                      }}
                    >
                      <X className="size-4" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      className="border-primary/40 text-primary hover:bg-primary/10"
                      onClick={() => {
                        toast.success("Information request sent on WhatsApp");
                        setActive(null);
                      }}
                    >
                      <HelpCircle className="size-4" />
                      Request More Info
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
