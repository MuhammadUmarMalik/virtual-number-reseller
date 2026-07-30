import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminActivationsPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="Activations">
      <FoundationPage
        title="Activation review"
        description="Ready for normalized activation statuses, expiry handling, ownership checks, and OTP redaction."
        items={["Waiting", "OTP received", "Expired", "Refunded"]}
      />
    </AppShell>
  );
}
