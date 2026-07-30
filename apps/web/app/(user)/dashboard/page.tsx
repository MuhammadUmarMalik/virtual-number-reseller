import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";
import { OnboardingStatus } from "@/components/onboarding-status";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <div className="mb-6">
        <OnboardingStatus />
      </div>
      <FoundationPage
        title="Wallet and activity overview"
        description="The dashboard shell is ready for balance, KYC, recent orders, active numbers, and abuse-control notices."
        items={["Wallet balance", "KYC gate", "Recent activations", "Top-up status"]}
      />
    </AppShell>
  );
}
