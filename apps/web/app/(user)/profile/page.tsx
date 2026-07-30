import { AppShell } from "@/components/app-shell";
import { OnboardingStatus } from "@/components/onboarding-status";
import { SessionSecurity } from "@/components/session-security";

export default function ProfilePage() {
  return (
    <AppShell title="Profile">
      <div className="space-y-6">
        <OnboardingStatus />
        <SessionSecurity />
      </div>
    </AppShell>
  );
}
