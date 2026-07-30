import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminPricingPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="Pricing">
      <FoundationPage
        title="Pricing rules"
        description="Ready for fixed price, fixed margin, percentage markup, minimum profit, and bulk discounts."
        items={["Fixed price", "Fixed margin", "Percentage markup", "Bulk discount"]}
      />
    </AppShell>
  );
}
