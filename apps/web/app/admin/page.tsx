import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="Admin">
      <FoundationPage
        title="Admin overview"
        description="The admin overview is ready for financial reports, user risk signals, payment reconciliation, and vendor health."
        items={["Users", "Payments", "Orders", "Audit logs"]}
      />
    </AppShell>
  );
}
