import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function MyNumbersPage() {
  return (
    <AppShell title="My Numbers">
      <FoundationPage
        title="Active numbers"
        description="The active numbers route is ready for owned activations, OTP polling, copy actions, expiry, and refund status."
        items={["Copy number", "OTP status", "Copy OTP", "Expiry countdown"]}
      />
    </AppShell>
  );
}
