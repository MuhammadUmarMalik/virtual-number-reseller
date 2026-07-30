import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminServicesPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="Services">
      <FoundationPage
        title="Service catalog"
        description="Ready for service availability, blocked services, and vendor product mapping."
        items={["Active", "Inactive", "Blocked", "Vendor mapping"]}
      />
    </AppShell>
  );
}
