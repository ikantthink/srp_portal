import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApiKeyManager } from "@/components/portal/settings/api-key-manager";

const services = [
  {
    key: "idx_broker",
    label: "IDX Broker",
    description: "Use this if you have an IDX Broker account.",
    fields: ["api_key", "output_type"],
  },
  {
    key: "reso",
    label: "RESO Web API",
    description: "OData v4 endpoint provided by your MLS.",
    fields: ["token", "base_url"],
  },
];

export default async function ListingsProviderPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Listings Provider</h1>
        <p className="text-muted-foreground">
          Credentials for the IDX or RESO Web API used by Featured Listings and
          Property Search blocks. Toggle the integration on/off in{" "}
          <a className="text-brand-primary hover:underline" href="/portal/super-admin/integrations">
            Integrations
          </a>
          .
        </p>
      </div>

      {services.map((service) => (
        <Card key={service.key}>
          <CardHeader>
            <CardTitle className="text-base">{service.label}</CardTitle>
            <CardDescription>{service.description}</CardDescription>
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
