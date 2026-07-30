import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";
import { OnboardingStatus } from "@/components/onboarding-status";

export default function BuyNumberPage() {
  return (
    <AppShell title="Buy Number">
      <div className="mb-6">
        <OnboardingStatus purchasePage />
      </div>
      <FoundationPage
        title="Purchase flow"
        description="The buy flow route is ready for service selection, country selection, backend quote, confirmation dialog, and bulk results."
        items={["Service selector", "Country selector", "Quantity mode", "Financial confirmation"]}
      />
    </AppShell>
  );
}
