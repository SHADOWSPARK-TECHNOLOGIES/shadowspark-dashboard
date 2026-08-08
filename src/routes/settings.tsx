import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { currentUser, tenant } from "@/lib/mock-data";
import { useTenantProfileQuery } from "@/lib/backend-api";

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
  const liveTenant = tenantQuery.data;

  return (
    <AppShell title="Settings" breadcrumb="ShadowSpark / Settings">
      <div className="grid max-w-4xl grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-4 rounded-xl border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold">Tenant profile</h2>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Organisation</Label>
              <Input defaultValue={liveTenant?.name ?? tenant.name} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Operations lead</Label>
              <Input defaultValue={currentUser.name} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Support line</Label>
              <Input defaultValue="+234 700 000 1234" className="num mt-1" />
            </div>
            <Button onClick={() => toast.success("Tenant profile saved")}>Save changes</Button>
          </div>
        </Card>

        <Card className="gap-4 rounded-xl border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold">Automation preferences</h2>
          <div className="space-y-4">
            {[
              ["Auto-request KYC on submission", true],
              ["Escalate loans above ₦1M to humans", true],
              ["Send WhatsApp repayment reminders", true],
              ["Auto-reject expired documents", false],
            ].map(([label, enabled]) => (
              <div key={String(label)} className="flex items-center justify-between gap-4">
                <span className="text-sm">{label}</span>
                <Switch defaultChecked={Boolean(enabled)} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="gap-4 rounded-xl border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <h2 className="text-sm font-semibold">Risk thresholds</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs text-muted-foreground">Minimum credit score</Label>
              <Input defaultValue="600" className="num mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Max exposure per applicant (₦)</Label>
              <Input defaultValue="1500000" className="num mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Overdue escalation (days)</Label>
              <Input defaultValue="5" className="num mt-1" />
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
