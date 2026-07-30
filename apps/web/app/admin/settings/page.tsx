import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminSettingsPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="Settings">
      <FoundationPage
        title="Platform settings"
        description="Ready for purchase limits, KYC gates, blocked service rules, rate limits, and abuse controls."
        items={["Purchase limits", "KYC gates", "Blocked services", "Rate limits"]}
      />
    </AppShell>
  );
}
