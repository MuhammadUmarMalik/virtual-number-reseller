import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminVendorsPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="Vendors">
      <FoundationPage
        title="Vendor configuration"
        description="Ready for vendor priority, health, encrypted credentials, allowed hostnames, and adapter status."
        items={["Priority", "Health", "Allowed hostnames", "Encrypted API key"]}
      />
    </AppShell>
  );
}
