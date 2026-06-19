import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { INTEGRATIONS } from "@/lib/integrations/registry";
import { getAllIntegrationStatuses } from "@/lib/integrations/status";
import { IntegrationToggleRow } from "@/components/portal/super-admin/integration-toggle-row";

export default async function IntegrationsPage() {
  const statuses = await getAllIntegrationStatuses();
  const statusByKey = new Map(statuses.map((s) => [s.key, s]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Enable or disable optional services. Required credentials live in
          environment variables &mdash; this page only flips the runtime switch.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available services</CardTitle>
          <CardDescription>
            Disabled services degrade gracefully: their UI affordances disappear
            and server actions short-circuit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {INTEGRATIONS.map((def) => {
            const status = statusByKey.get(def.key)!;
            return (
              <IntegrationToggleRow key={def.key} def={def} status={status} />
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
