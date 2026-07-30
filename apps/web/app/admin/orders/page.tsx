import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminOrdersPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="Orders">
      <FoundationPage
        title="Order review"
        description="Ready for order search, bulk item results, price snapshots, and refund references."
        items={["Order number", "Price snapshot", "Bulk status", "Refund link"]}
      />
    </AppShell>
  );
}
