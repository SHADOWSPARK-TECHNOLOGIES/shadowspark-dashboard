import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import type { LoanApplication, LoanStatus } from "@/types";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoanDetailPanel } from "@/components/loans/loan-detail-panel";
import { AsyncError, AsyncLoading } from "@/components/ui/async-state";
import { useCreateLoanMutation, useUpdateLoanStatusMutation } from "@/hooks/use-lending";
import { formatNaira, initials, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { normalizeApiError, normalizeBackendLoan, useLoansQuery } from "@/lib/backend-api";

export const Route = createFileRoute("/loans")({
  head: () => ({
    meta: [
      { title: "Loan Applications — ShadowSpark" },
      {
        name: "description",
        content:
          "Filter, sort and action every loan application in your portfolio with KYC, repayment and audit context.",
      },
      { property: "og:title", content: "Loan Applications — ShadowSpark" },
      {
        property: "og:description",
        content: "Manage and track loan applications across your lending portfolio.",
      },
    ],
  }),
  component: LoansPage,
});

const allStatuses: LoanStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "KYC_PENDING",
  "KYC_VERIFIED",
  "CREDIT_CHECK",
  "APPROVED",
  "REJECTED",
  "DISBURSED",
  "DEFAULTED",
  "CLOSED",
];

const STATUS_FLOW: LoanStatus[] = [
  "SUBMITTED",
  "KYC_PENDING",
  "KYC_VERIFIED",
  "CREDIT_CHECK",
  "APPROVED",
  "REJECTED",
  "DISBURSED",
  "CLOSED",
];

function CreateLoanDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMutation = useCreateLoanMutation();
  const [form, setForm] = useState({
    applicantName: "",
    applicantPhone: "",
    applicantEmail: "",
    loanAmount: "",
    loanPurpose: "",
    tenureMonths: "",
  });

  function update(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const input: Parameters<typeof createMutation.mutate>[0] = {
      applicantName: form.applicantName.trim(),
      applicantPhone: form.applicantPhone.trim(),
      loanAmount: Number(form.loanAmount),
    };
    const email = form.applicantEmail.trim();
    if (email) input.applicantEmail = email;
    const purpose = form.loanPurpose.trim();
    if (purpose) input.loanPurpose = purpose;
    if (form.tenureMonths) input.tenureMonths = Number(form.tenureMonths);

    createMutation.mutate(input, {
      onSuccess: () => {
        onOpenChange(false);
        setForm({
          applicantName: "",
          applicantPhone: "",
          applicantEmail: "",
          loanAmount: "",
          loanPurpose: "",
          tenureMonths: "",
        });
      },
    });
  }

  const valid =
    form.applicantName.trim() && form.applicantPhone.trim() && Number(form.loanAmount) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card">
        <DialogTitle>New loan application</DialogTitle>
        <form onSubmit={submit} className="mt-2 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Applicant name</Label>
            <Input
              value={form.applicantName}
              onChange={update("applicantName")}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input
              value={form.applicantPhone}
              onChange={update("applicantPhone")}
              className="num mt-1"
              required
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email (optional)</Label>
            <Input
              type="email"
              value={form.applicantEmail}
              onChange={update("applicantEmail")}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Amount (₦)</Label>
              <Input
                inputMode="numeric"
                value={form.loanAmount}
                onChange={update("loanAmount")}
                className="num mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tenure (months)</Label>
              <Input
                inputMode="numeric"
                value={form.tenureMonths}
                onChange={update("tenureMonths")}
                className="num mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Purpose</Label>
            <Input value={form.loanPurpose} onChange={update("loanPurpose")} className="mt-1" />
          </div>
          <Button type="submit" className="w-full" disabled={!valid || createMutation.isPending}>
            {createMutation.isPending ? "Creating…" : "Create application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LoansPage() {
  const loansQuery = useLoansQuery();
  const statusMutation = useUpdateLoanStatusMutation();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<LoanStatus[]>([]);
  const [search, setSearch] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [officer, setOfficer] = useState("all");
  const [activeLoan, setActiveLoan] = useState<LoanApplication | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const liveLoans = useMemo(
    () => (loansQuery.data?.data ?? []).map(normalizeBackendLoan),
    [loansQuery.data?.data],
  );

  const officerNames = useMemo(
    () =>
      Array.from(
        new Set(
          liveLoans
            .map((loan) => loan.assignedOfficer?.name)
            .filter((name): name is string => Boolean(name)),
        ),
      ),
    [liveLoans],
  );

  const filtered = useMemo(() => {
    return liveLoans.filter((loan) => {
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(loan.status)) return false;
      if (officer !== "all" && loan.assignedOfficer?.name !== officer) return false;
      if (minAmount && loan.loanAmount < Number(minAmount)) return false;
      if (maxAmount && loan.loanAmount > Number(maxAmount)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !loan.applicantName.toLowerCase().includes(q) &&
          !loan.applicantPhone.includes(q) &&
          !loan.id.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [liveLoans, selectedStatuses, officer, minAmount, maxAmount, search]);

  const columns = useMemo<ColumnDef<LoanApplication, unknown>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "applicantName",
        header: "Applicant",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="num grid size-8 place-items-center rounded-full bg-elevated text-[11px] font-semibold text-primary">
              {initials(row.original.applicantName)}
            </span>
            <span>
              <span className="block text-sm font-medium">{row.original.applicantName}</span>
              <span className="num block text-[11px] text-muted-foreground">
                {row.original.applicantPhone}
              </span>
            </span>
          </div>
        ),
      },
      {
        accessorKey: "loanAmount",
        header: "Loan Amount",
        cell: ({ row }) => (
          <span className="num block text-right font-medium">
            {formatNaira(row.original.loanAmount)}
          </span>
        ),
      },
      {
        accessorKey: "loanPurpose",
        header: "Purpose",
        cell: ({ row }) => (
          <span className="block max-w-[190px] truncate text-muted-foreground">
            {row.original.loanPurpose}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "interestRate",
        header: "Rate",
        cell: ({ row }) => <span className="num">{row.original.interestRate}%</span>,
      },
      {
        accessorKey: "tenureMonths",
        header: "Tenure",
        cell: ({ row }) => <span className="num">{row.original.tenureMonths} months</span>,
      },
      {
        id: "officer",
        header: "Officer",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="num grid size-6 place-items-center rounded-full bg-elevated text-[10px] text-muted-foreground">
              {initials(row.original.assignedOfficer?.name ?? "—")}
            </span>
            <span className="text-xs">{row.original.assignedOfficer?.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {relativeTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Row actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveLoan(row.original)}>
                <Eye className="size-4" />
                View
              </DropdownMenuItem>
              {STATUS_FLOW.filter((status) => status !== row.original.status).map((status) => (
                <DropdownMenuItem
                  key={status}
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ id: row.original.id, status })}
                >
                  <RefreshCcw className="size-4" />
                  Set {status.replace(/_/g, " ")}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [statusMutation],
  );

  return (
    <AppShell
      title="Loan Applications"
      breadcrumb="ShadowSpark / Loans"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="size-4" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex"
            onClick={() => {
              const header = "id,applicantName,applicantPhone,loanAmount,status,createdAt";
              const rows = filtered.map((loan) =>
                [
                  loan.id,
                  JSON.stringify(loan.applicantName),
                  loan.applicantPhone,
                  loan.loanAmount,
                  loan.status,
                  loan.createdAt,
                ].join(","),
              );
              const blob = new Blob([[header, ...rows].join("\n")], {
                type: "text/csv",
              });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `loans-${new Date().toISOString().slice(0, 10)}.csv`;
              link.click();
              URL.revokeObjectURL(url);
              toast.success("CSV export downloaded");
            }}
          >
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Application</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Loan Applications</h2>
          <p className="text-sm text-muted-foreground">
            Manage and track all loan applications across your portfolio
          </p>
        </div>

        {showFilters ? (
          <Card className="gap-4 rounded-xl border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap gap-1.5">
              {allStatuses.map((status) => {
                const active = selectedStatuses.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() =>
                      setSelectedStatuses((prev) =>
                        active ? prev.filter((s) => s !== status) : [...prev, status],
                      )
                    }
                    className={cn(
                      "rounded-md border px-2 py-1 text-[11px] tracking-wide uppercase transition-colors",
                      active
                        ? "border-primary/40 bg-primary/12 text-primary"
                        : "border-border text-muted-foreground hover:bg-elevated",
                    )}
                  >
                    {status.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <Label className="text-xs text-muted-foreground">Search applicant</Label>
                <Input
                  className="mt-1"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, phone or loan ID"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Amount range (₦)</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    value={minAmount}
                    onChange={(event) => setMinAmount(event.target.value)}
                    placeholder="Min"
                    inputMode="numeric"
                  />
                  <Input
                    value={maxAmount}
                    onChange={(event) => setMaxAmount(event.target.value)}
                    placeholder="Max"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Assigned officer</Label>
                <Select value={officer} onValueChange={setOfficer}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All officers</SelectItem>
                    {officerNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedStatuses([]);
                    setSearch("");
                    setMinAmount("");
                    setMaxAmount("");
                    setOfficer("all");
                  }}
                >
                  Reset filters
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {loansQuery.isPending ? (
          <AsyncLoading rows={6} />
        ) : loansQuery.isError ? (
          <AsyncError
            title="Failed to load loan applications"
            message={normalizeApiError(loansQuery.error).error.message}
            onRetry={() => loansQuery.refetch()}
          />
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            pageSize={8}
            enableSelection
            onRowClick={(loan) => setActiveLoan(loan)}
            bulkActions={(count, clear, rows) => (
              <>
                <Button
                  size="sm"
                  disabled={statusMutation.isPending}
                  onClick={() => {
                    for (const row of rows) {
                      statusMutation.mutate({ id: row.id, status: "APPROVED" });
                    }
                    clear();
                  }}
                >
                  Approve {count}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  disabled={statusMutation.isPending}
                  onClick={() => {
                    for (const row of rows) {
                      statusMutation.mutate({ id: row.id, status: "REJECTED" });
                    }
                    clear();
                  }}
                >
                  Reject {count}
                </Button>
              </>
            )}
            emptyState={
              <EmptyState
                title="No loan applications found"
                description="Get started by creating your first loan application."
                actionLabel="Create Loan Application"
                onAction={() => setCreateOpen(true)}
              />
            }
          />
        )}
      </div>

      <CreateLoanDialog open={createOpen} onOpenChange={setCreateOpen} />

      <LoanDetailPanel loan={activeLoan} onClose={() => setActiveLoan(null)} />
    </AppShell>
  );
}
