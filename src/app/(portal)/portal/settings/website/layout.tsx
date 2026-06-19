export default function WebsiteSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Website</h1>
        <p className="text-muted-foreground">
          Block presets and reusable defaults for the page builder
        </p>
      </div>
      <div>{children}</div>
    </div>
  );
}
