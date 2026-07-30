import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function SupportPage() {
  return (
    <AppShell title="Support">
      <FoundationPage
        title="Support"
        description="The support route is ready for order help, payment help, abuse reports, and escalation tracking."
        items={["Payment issue", "OTP issue", "Refund issue", "Abuse report"]}
      />
    </AppShell>
  );
}
