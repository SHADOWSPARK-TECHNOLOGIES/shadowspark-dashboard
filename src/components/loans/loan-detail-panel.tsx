import { useMemo, useState } from "react";
import { Check, CheckCircle2, X } from "lucide-react";
import type { LoanApplication, LoanStatus, Message } from "@/types";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ChatThread } from "@/components/ui/chat-thread";
import { StatusBadge } from "@/components/ui/status-badge";
import { AfroLLMChat } from "@/components/dashboard/AfroLLMChat";
import {
  useAssignLoanMutation,
  useLoanDetailQuery,
  useUpdateLoanStatusMutation,
} from "@/hooks/use-lending";
import { useConversationMessagesQuery } from "@/hooks/use-messages";
import { useAuthMeQuery } from "@/hooks/use-auth";
import { formatDate, formatNaira } from "@/lib/format";
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
                    <span
                      className={cn("my-1 w-px flex-1", done ? "bg-success/40" : "bg-border")}
                    />
                  ) : null}
                </div>
                <div className="pb-5">
                  <p
                    className={cn(
                      "text-sm",
                      active ? "font-medium text-primary" : "text-foreground",
                    )}
                  >
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
        <AssignOfficerSelect loan={loan} />
      </div>
    </div>
  );
}

function AssignOfficerSelect({ loan }: { loan: LoanApplication }) {
  const assignMutation = useAssignLoanMutation();
  const [value, setValue] = useState(loan.assignedOfficer?.id ?? "");

  return (
    <Select
      value={value}
      onValueChange={(officerUserId) => {
        setValue(officerUserId);
        assignMutation.mutate({ id: loan.id, officerUserId });
      }}
      disabled={assignMutation.isPending}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select officer" />
      </SelectTrigger>
      <SelectContent>
        {loan.assignedOfficer?.id ? (
          <SelectItem value={loan.assignedOfficer.id}>{loan.assignedOfficer.name}</SelectItem>
        ) : null}
        {/* Team directory endpoint not available — only the currently assigned officer is listed. */}
      </SelectContent>
    </Select>
  );
}

function MessagesTab({ loan }: { loan: LoanApplication }) {
  const messagesQuery = useConversationMessagesQuery(loan.id, "WHATSAPP");
  const messages: Message[] = useMemo(
    () =>
      (messagesQuery.data ?? []).map((message) => ({
        id: message.id,
        channel: (message.channel as Message["channel"]) ?? "WHATSAPP",
        direction: message.direction ?? "OUTBOUND",
        from: message.from ?? loan.applicantPhone,
        to: message.to ?? loan.applicantPhone,
        body: message.body ?? message.content ?? "",
        status: (message.status as Message["status"]) ?? "DELIVERED",
        createdAt: message.createdAt,
      })),
    [messagesQuery.data, loan.applicantPhone],
  );

  if (messagesQuery.isPending) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-3/4" />
        ))}
      </div>
    );
  }

  if (messagesQuery.isError) {
    return (
      <div className="p-4">
        <EmptyState
          title="Couldn't load messages"
          description="The conversation could not be fetched from the backend."
          actionLabel="Retry"
          onAction={() => messagesQuery.refetch()}
        />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          title="No messages yet"
          description="No conversation exists for this loan application."
        />
      </div>
    );
  }

  return <ChatThread messages={messages} defaultChannel="WHATSAPP" />;
}

function AiTab({ loan }: { loan: LoanApplication }) {
  return (
    <AfroLLMChat
      className="h-full"
      loanContext={{
        loanId: loan.id,
        applicantName: loan.applicantName,
        loanAmount: loan.loanAmount,
        status: loan.status,
      }}
    />
  );
}

const MISSING_TABS: { value: string; label: string; description: string }[] = [
  {
    value: "kyc",
    label: "KYC",
    description: "Per-loan KYC document listing endpoint is not available on the backend.",
  },
  {
    value: "repayments",
    label: "Repayments",
    description: "Repayment schedule endpoint is not available on the backend.",
  },
  {
    value: "audit",
    label: "Audit",
    description: "Audit trail endpoint is not available on the backend.",
  },
];

function MissingTab({ label, description }: { label: string; description: string }) {
  return (
    <div className="p-4">
      <EmptyState title={`${label} unavailable`} description={description} />
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
  const statusMutation = useUpdateLoanStatusMutation();
  const authQuery = useAuthMeQuery();
  const detailQuery = useLoanDetailQuery(loan?.id ?? null);
  const canDecide = Boolean(authQuery.data?.user);
  const liveLoan = detailQuery.data ?? loan;

  function decide(loan: LoanApplication, status: LoanStatus) {
    statusMutation.mutate({ id: loan.id, status }, { onSettled: () => onClose() });
  }

  return (
    <Sheet open={Boolean(loan)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-border bg-card p-0 shadow-[var(--shadow-panel)] sm:max-w-[480px]"
      >
        {loan ? (
          <>
            {detailQuery.isPending ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-3 w-44" />
                <Skeleton className="h-44 w-full" />
              </div>
            ) : detailQuery.isError ? (
              <div className="p-5">
                <EmptyState
                  title="Couldn't load loan detail"
                  description={
                    detailQuery.error instanceof Error
                      ? detailQuery.error.message
                      : "The loan detail endpoint failed."
                  }
                  actionLabel="Retry"
                  onAction={() => detailQuery.refetch()}
                />
              </div>
            ) : !liveLoan ? (
              <div className="p-5">
                <EmptyState
                  title="Loan unavailable"
                  description="The selected loan could not be found."
                />
              </div>
            ) : (
              <>
                <div className="border-b border-border px-5 py-4">
                  <SheetTitle className="text-base">{liveLoan.applicantName}</SheetTitle>
                  <p className="num mt-0.5 text-xs text-muted-foreground">
                    {liveLoan.applicantPhone} · {liveLoan.id}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={liveLoan.status} />
                  </div>
                </div>

                <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col gap-0">
                  <TabsList className="scroll-slim h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent px-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="kyc">KYC</TabsTrigger>
                    <TabsTrigger value="repayments">Repayments</TabsTrigger>
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                    <TabsTrigger value="ai">AfroLLM</TabsTrigger>
                    <TabsTrigger value="audit">Audit</TabsTrigger>
                  </TabsList>

                  <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">
                    <TabsContent value="overview" className="m-0 p-5">
                      <OverviewTab loan={liveLoan} />
                    </TabsContent>
                    {MISSING_TABS.filter((t) => t.value === "kyc").map((tab) => (
                      <TabsContent key={tab.value} value={tab.value} className="m-0">
                        <MissingTab label={tab.label} description={tab.description} />
                      </TabsContent>
                    ))}
                    {MISSING_TABS.filter((t) => t.value === "repayments").map((tab) => (
                      <TabsContent key={tab.value} value={tab.value} className="m-0">
                        <MissingTab label={tab.label} description={tab.description} />
                      </TabsContent>
                    ))}
                    <TabsContent value="messages" className="m-0 flex h-full flex-col p-0">
                      <MessagesTab loan={liveLoan} />
                    </TabsContent>
                    <TabsContent value="ai" className="m-0 flex h-full flex-col p-0">
                      <AiTab loan={liveLoan} />
                    </TabsContent>
                    {MISSING_TABS.filter((t) => t.value === "audit").map((tab) => (
                      <TabsContent key={tab.value} value={tab.value} className="m-0">
                        <MissingTab label={tab.label} description={tab.description} />
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>

                <div className="flex gap-2 border-t border-border bg-card px-5 py-4">
                  <Button
                    className="flex-1"
                    disabled={!canDecide || statusMutation.isPending}
                    onClick={() => decide(liveLoan, "APPROVED")}
                  >
                    <CheckCircle2 className="size-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={!canDecide || statusMutation.isPending}
                    onClick={() => decide(liveLoan, "REJECTED")}
                  >
                    <X className="size-4" />
                    Reject
                  </Button>
                </div>
              </>
            )}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
