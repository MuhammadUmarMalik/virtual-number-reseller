import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function TransactionsPage() {
  return (
    <AppShell title="Transactions">
      <FoundationPage
        title="Wallet ledger"
        description="The transactions route is ready for immutable wallet credits, debits, refunds, reversals, and references."
        items={["Top-ups", "Purchases", "Refunds", "Admin adjustments"]}
      />
    </AppShell>
  );
}
