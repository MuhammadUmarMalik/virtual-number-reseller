import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminCountriesPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="Countries">
      <FoundationPage
        title="Country catalog"
        description="Ready for country availability, dial code management, and vendor product mapping."
        items={["ISO code", "Dial code", "Availability", "Vendor products"]}
      />
    </AppShell>
  );
}
