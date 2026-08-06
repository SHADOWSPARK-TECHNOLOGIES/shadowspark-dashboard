import { useState } from "react";
import {
  Check,
  CheckCircle2,
  FileText,
  IdCard,
  Receipt,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { LoanApplication } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChatThread } from "@/components/ui/chat-thread";
import { DocumentViewer } from "@/components/ui/document-viewer";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  auditEntries,
  conversations,
  kycDocuments,
  officers,
  repayments,
} from "@/lib/mock-data";
import { formatDate, formatNaira, formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";

const steps = ["Submitted", "KYC", "Credit Check", "Approved", "Disbursed"];

const statusStep: Record<string, number> = {
  DRAFT: 0,
  SUBMITTED: 0,
  KYC_PENDING: 1,
  KYC_VERIFIED: 1,
  CREDIT_CHECK: 2,
  APPROVED: 3,
  REJECTED: 3,
  DISBURSED: 4,
  DEFAULTED: 4,
  CLOSED: 4,
};

const docIcons = {
  NIN: IdCard,
  DRIVERS_LICENSE: IdCard,
  PASSPORT: IdCard,
  UTILITY_BILL: Receipt,
  BANK_STATEMENT: FileText,
  SELFIE: ShieldCheck,
  SIGNATURE: FileText,
} as const;

function OverviewTab({ loan }: { loan: LoanApplication }) {
  const current = statusStep[loan.status] ?? 0;
  const details: [string, string][] = [
    ["Amount", formatNaira(loan.loanAmount)],
    ["Interest", `${loan.interestRate ?? 0}%`],
    ["Tenure", `${loan.tenureMonths ?? 0} months`],
    ["Monthly payment", formatNaira(loan.monthlyRepayment ?? 0)],
    ["Total repayable", formatNaira(loan.totalRepayable ?? 0)],
    ["Disbursement date", formatDate(loan.createdAt)],
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {details.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-elevated/40 p-3">
            <p className="text-[10px] tracking-wider text-subtle uppercase">{label}</p>
            <p className="num mt-1 text-sm font-medium">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Status timeline
        </p>
        <ol className="mt-3 space-y-0">
          {steps.map((step, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={step} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full border text-[10px]",
                      active
                        ? "border-primary bg-primary/15 text-primary"
                        : done
                          ? "border-success/50 bg-success/15 text-success"
                          : "border-border bg-elevated text-subtle",
                    )}
                  >
                    {done ? <Check className="size-3" /> : i + 1}
                  </span>
                  {i < steps.length - 1 ? (
                    <span className={cn("my-1 w-px flex-1", done ? "bg-success/40" : "bg-border")} />
                  ) : null}
                </div>
                <div className="pb-5">
                  <p className={cn("text-sm", active ? "font-medium text-primary" : "text-foreground")}>
                    {step}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {done ? "Completed" : active ? "In progress" : "Pending"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Assigned officer</Label>
        <Select defaultValue={loan.assignedOfficer?.name ?? officers[0]!.name}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {officers.map((officer) => (
              <SelectItem key={officer.name} value={officer.name}>
                {officer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function KycTab() {
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const docs = kycDocuments.slice(0, 4);

  return (
    <div className="space-y-4">
      {docs.map((doc) => {
        const Icon = docIcons[doc.type];
        return (
          <div key={doc.id} className="rounded-xl border border-border bg-elevated/40 p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-card text-primary">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => setOpenDoc(doc.id)}
                  className="truncate text-sm font-medium hover:text-primary hover:underline"
                >
                  {doc.type.replace(/_/g, " ").toLowerCase()}-{doc.id}.jpg
                </button>
                <p className="num text-[11px] text-muted-foreground">
                  Uploaded {formatDate(doc.submittedAt)}
                </p>
              </div>
              <StatusBadge status={doc.status} />
            </div>

            {doc.ocrData ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {Object.entries(doc.ocrData).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-[10px] tracking-wider text-subtle uppercase">{key}</Label>
                    <Input readOnly value={value} className="mt-1 h-8 bg-card text-xs" />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-success/40 text-success hover:bg-success/10"
                onClick={() => toast.success(`${doc.id} verified`)}
              >
                <CheckCircle2 className="size-3.5" />
                Verify
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => toast.error(`${doc.id} rejected`)}
              >
                <X className="size-3.5" />
                Reject
              </Button>
            </div>

            <Dialog open={openDoc === doc.id} onOpenChange={(open) => setOpenDoc(open ? doc.id : null)}>
              <DialogContent className="flex h-[85vh] max-w-4xl flex-col border-border bg-card p-4 shadow-[var(--shadow-panel)]">
                <DialogTitle className="text-sm">{doc.type.replace(/_/g, " ")} document</DialogTitle>
                <DocumentViewer label={`${doc.id} · ${doc.applicantName}`} />
              </DialogContent>
            </Dialog>
          </div>
        );
      })}
    </div>
  );
}

function RepaymentsTab() {
  return (
    <div className="scroll-slim overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-max text-sm">
        <thead className="bg-elevated/50">
          <tr className="text-[11px] tracking-wider text-muted-foreground uppercase">
            <th className="px-3 py-2.5 text-left font-semibold">Due date</th>
            <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
            <th className="px-3 py-2.5 text-left font-semibold">Paid</th>
            <th className="px-3 py-2.5 text-left font-semibold">Status</th>
            <th className="px-3 py-2.5 text-left font-semibold">Method</th>
            <th className="px-3 py-2.5 text-left font-semibold">Reference</th>
            <th className="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {repayments.map((repayment) => (
            <tr key={repayment.id} className="border-t border-border/60">
              <td className="num px-3 py-2.5">{formatDate(repayment.dueDate)}</td>
              <td className="num px-3 py-2.5 text-right">{formatNaira(repayment.amount)}</td>
              <td className="num px-3 py-2.5 text-muted-foreground">
                {repayment.paidDate ? formatDate(repayment.paidDate) : "—"}
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge status={repayment.status} />
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">{repayment.paymentMethod}</td>
              <td className="num px-3 py-2.5 text-muted-foreground">{repayment.reference}</td>
              <td className="px-3 py-2.5">
                {repayment.status === "OVERDUE" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success("Reminder sent on WhatsApp")}
                  >
                    <Send className="size-3.5" />
                    Remind
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditTab() {
  return (
    <div className="scroll-slim overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-max text-sm">
        <thead className="bg-elevated/50">
          <tr className="text-[11px] tracking-wider text-muted-foreground uppercase">
            <th className="px-3 py-2.5 text-left font-semibold">Timestamp</th>
            <th className="px-3 py-2.5 text-left font-semibold">User</th>
            <th className="px-3 py-2.5 text-left font-semibold">Action</th>
            <th className="px-3 py-2.5 text-left font-semibold">Details</th>
          </tr>
        </thead>
        <tbody>
          {auditEntries.map((entry) => (
            <tr key={entry.id} className="border-t border-border/60">
              <td className="num px-3 py-2.5 text-xs text-muted-foreground">
                {formatTimestamp(entry.timestamp)}
              </td>
              <td className="px-3 py-2.5">{entry.user}</td>
              <td className="num px-3 py-2.5 text-xs text-primary">{entry.action}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{entry.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LoanDetailPanel({
  loan,
  onClose,
}: {
  loan: LoanApplication | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(loan)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-border bg-card p-0 shadow-[var(--shadow-panel)] sm:max-w-[480px]"
      >
        {loan ? (
          <>
            <div className="border-b border-border px-5 py-4">
              <SheetTitle className="text-base">{loan.applicantName}</SheetTitle>
              <p className="num mt-0.5 text-xs text-muted-foreground">
                {loan.applicantPhone} · {loan.id}
              </p>
              <div className="mt-2">
                <StatusBadge status={loan.status} />
              </div>
            </div>

            <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col gap-0">
              <TabsList className="scroll-slim h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent px-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="kyc">KYC</TabsTrigger>
                <TabsTrigger value="repayments">Repayments</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="audit">Audit</TabsTrigger>
              </TabsList>

              <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">
                <TabsContent value="overview" className="m-0 p-5">
                  <OverviewTab loan={loan} />
                </TabsContent>
                <TabsContent value="kyc" className="m-0 p-5">
                  <KycTab />
                </TabsContent>
                <TabsContent value="repayments" className="m-0 p-5">
                  <RepaymentsTab />
                </TabsContent>
                <TabsContent value="messages" className="m-0 flex h-full flex-col p-0">
                  <ChatThread messages={conversations[0]!.messages} />
                </TabsContent>
                <TabsContent value="audit" className="m-0 p-5">
                  <AuditTab />
                </TabsContent>
              </div>
            </Tabs>

            <div className="flex gap-2 border-t border-border bg-card px-5 py-4">
              <Button
                className="flex-1"
                onClick={() => {
                  toast.success(`${loan.id} approved`);
                  onClose();
                }}
              >
                <CheckCircle2 className="size-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  toast.error(`${loan.id} rejected`);
                  onClose();
                }}
              >
                <X className="size-4" />
                Reject
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
