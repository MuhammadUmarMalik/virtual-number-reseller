import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function OrdersPage() {
  return (
    <AppShell title="Orders">
      <FoundationPage
        title="Order history"
        description="The orders route is ready for single and bulk order history with item-level partial success states."
        items={["Completed", "Partial", "Failed", "Refunded"]}
      />
    </AppShell>
  );
}
