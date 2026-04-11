import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiKeyManager } from "@/components/portal/settings/api-key-manager";

const services = [
  { key: "twilio", label: "Twilio", fields: ["account_sid", "auth_token", "phone_number"] },
  { key: "resend", label: "Resend", fields: ["api_key"] },
  { key: "idx_broker", label: "IDX Broker", fields: ["api_key", "output_type"] },
  { key: "reso", label: "RESO Web API", fields: ["token", "base_url"] },
  { key: "openai", label: "OpenAI", fields: ["api_key"] },
  { key: "google_oauth", label: "Google OAuth", fields: ["client_id", "client_secret"] },
];

export default async function ApiKeysPage() {
  const supabase = await createClient();

  const { data: configs } = await supabase
    .from("api_configurations")
    .select("*");

  const configMap: Record<string, Record<string, unknown>> = {};
  configs?.forEach((c) => {
    configMap[c.service] = c.config as Record<string, unknown>;
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground">Configure third-party service integrations</p>
      </div>

      {services.map((service) => (
        <Card key={service.key}>
          <CardHeader>
            <CardTitle className="text-base">{service.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <ApiKeyManager
              service={service.key}
              fields={service.fields}
              currentConfig={configMap[service.key] || {}}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
