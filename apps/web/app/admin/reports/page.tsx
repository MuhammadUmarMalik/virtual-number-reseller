import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminReportsPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="Reports">
      <FoundationPage
        title="Reports"
        description="Ready for top-ups, sales, vendor cost, gross profit, refunds, and vendor success rates."
        items={["Sales revenue", "Vendor cost", "Gross profit", "Refund amount"]}
      />
    </AppShell>
  );
}
