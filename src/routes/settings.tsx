import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthMeQuery } from "@/hooks/use-auth";
import { useTenantProfileQuery } from "@/lib/backend-api";
import { useUpdateSettingsMutation } from "@/hooks/use-tenant";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ShadowSpark" },
      {
        name: "description",
        content: "Manage tenant profile, notification channels and operational thresholds.",
      },
      { property: "og:title", content: "Settings — ShadowSpark" },
      {
        property: "og:description",
        content: "Tenant, notification and risk threshold configuration.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const tenantQuery = useTenantProfileQuery();
  const authQuery = useAuthMeQuery();
  const updateSettingsMutation = useUpdateSettingsMutation();

  const [organization, setOrganization] = useState("");
  const [operationsLead, setOperationsLead] = useState("");
  const [supportLine, setSupportLine] = useState("");

  const [autoRequestKyc, setAutoRequestKyc] = useState(true);
  const [escalateHighValue, setEscalateHighValue] = useState(true);
  const [sendWhatsAppReminders, setSendWhatsAppReminders] = useState(true);
  const [autoRejectExpiredDocs, setAutoRejectExpiredDocs] = useState(false);

  const [minimumCreditScore, setMinimumCreditScore] = useState("600");
  const [maxExposure, setMaxExposure] = useState("1500000");
  const [overdueEscalationDays, setOverdueEscalationDays] = useState("5");

  useEffect(() => {
    if (!tenantQuery.data) return;
    setOrganization(tenantQuery.data.name ?? "");
  }, [tenantQuery.data]);

  useEffect(() => {
    if (!authQuery.data?.user) return;
    const user = authQuery.data.user;
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    setOperationsLead(fullName || user.email);
  }, [authQuery.data]);

  useEffect(() => {
    if (supportLine) return;
    setSupportLine("+234 700 000 1234");
  }, [supportLine]);

  const loading = tenantQuery.isPending || authQuery.isPending;
  const error = tenantQuery.error ?? authQuery.error;

  function saveTenantProfile() {
    updateSettingsMutation.mutate({
      category: "tenant",
      key: "profile",
      oldValue: {
        name: tenantQuery.data?.name ?? "",
        supportLine: "+234 700 000 1234",
      },
      newValue: {
        name: organization.trim(),
        operationsLead: operationsLead.trim(),
        supportLine: supportLine.trim(),
      },
    });
  }

  function saveAutomationPreferences() {
    updateSettingsMutation.mutate({
      category: "automation",
      key: "preferences",
      oldValue: null,
      newValue: {
        autoRequestKyc,
        escalateHighValue,
        sendWhatsAppReminders,
        autoRejectExpiredDocs,
      },
    });
  }

  function saveRiskThresholds() {
    updateSettingsMutation.mutate({
      category: "risk",
      key: "thresholds",
      oldValue: null,
      newValue: {
        minimumCreditScore: Number(minimumCreditScore) || 0,
        maxExposure: Number(maxExposure) || 0,
        overdueEscalationDays: Number(overdueEscalationDays) || 0,
      },
    });
  }

  return (
    <AppShell title="Settings" breadcrumb="ShadowSpark / Settings">
      {loading ? (
        <div className="grid max-w-4xl grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="gap-4 rounded-xl border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="max-w-3xl">
          <EmptyState
            title="Failed to load settings"
            description={error instanceof Error ? error.message : "Unable to load tenant settings."}
            actionLabel="Retry"
            onAction={() => {
              void tenantQuery.refetch();
              void authQuery.refetch();
            }}
          />
        </div>
      ) : !tenantQuery.data ? (
        <div className="max-w-3xl">
          <EmptyState
            title="No tenant profile"
            description="Tenant profile is not available from the backend yet."
            actionLabel="Retry"
            onAction={() => void tenantQuery.refetch()}
          />
        </div>
      ) : (
        <div className="grid max-w-4xl grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="gap-4 rounded-xl border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold">Tenant profile</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Organisation</Label>
                <Input value={organization} onChange={(event) => setOrganization(event.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Operations lead</Label>
                <Input value={operationsLead} onChange={(event) => setOperationsLead(event.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Support line</Label>
                <Input value={supportLine} onChange={(event) => setSupportLine(event.target.value)} className="num mt-1" />
              </div>
              <Button onClick={saveTenantProfile} disabled={updateSettingsMutation.isPending}>
                {updateSettingsMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </Card>

          <Card className="gap-4 rounded-xl border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold">Automation preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm">Auto-request KYC on submission</span>
                <Switch checked={autoRequestKyc} onCheckedChange={setAutoRequestKyc} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm">Escalate loans above N1M to humans</span>
                <Switch checked={escalateHighValue} onCheckedChange={setEscalateHighValue} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm">Send WhatsApp repayment reminders</span>
                <Switch checked={sendWhatsAppReminders} onCheckedChange={setSendWhatsAppReminders} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm">Auto-reject expired documents</span>
                <Switch checked={autoRejectExpiredDocs} onCheckedChange={setAutoRejectExpiredDocs} />
              </div>
              <Button variant="outline" onClick={saveAutomationPreferences} disabled={updateSettingsMutation.isPending}>
                {updateSettingsMutation.isPending ? "Saving..." : "Save automation"}
              </Button>
            </div>
          </Card>

          <Card className="gap-4 rounded-xl border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
            <h2 className="text-sm font-semibold">Team</h2>
            <EmptyState
              title="Team management unavailable"
              description="MISSING: /api/proxy/v1/team endpoint is not available from backend yet."
            />
          </Card>

          <Card className="gap-4 rounded-xl border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
            <h2 className="text-sm font-semibold">Risk thresholds</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-xs text-muted-foreground">Minimum credit score</Label>
                <Input value={minimumCreditScore} onChange={(event) => setMinimumCreditScore(event.target.value)} className="num mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Max exposure per applicant (N)</Label>
                <Input value={maxExposure} onChange={(event) => setMaxExposure(event.target.value)} className="num mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Overdue escalation (days)</Label>
                <Input value={overdueEscalationDays} onChange={(event) => setOverdueEscalationDays(event.target.value)} className="num mt-1" />
              </div>
            </div>
            <div>
              <Button variant="outline" onClick={saveRiskThresholds} disabled={updateSettingsMutation.isPending}>
                {updateSettingsMutation.isPending ? "Saving..." : "Save thresholds"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
