import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminPaymentsPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="Payments">
      <FoundationPage
        title="Payment review"
        description="Ready for gateway states, verified callbacks, duplicate callback handling, and reconciliation."
        items={["Created", "Success", "Failed", "Duplicate callbacks"]}
      />
    </AppShell>
  );
}
