import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminRefundsPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="Refunds">
      <FoundationPage
        title="Refund review"
        description="Ready for eligible failed activations, idempotent wallet credits, and refund failure review."
        items={["Eligibility", "Idempotency", "Wallet credit", "Failure review"]}
      />
    </AppShell>
  );
}
