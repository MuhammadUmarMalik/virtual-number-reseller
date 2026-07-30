import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminWalletsPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="Wallets">
      <FoundationPage
        title="Wallet review"
        description="Ready for balance inspection, ledger reconciliation, and approved credit/debit adjustments."
        items={["Balance", "Ledger", "Adjustment", "Reconciliation"]}
      />
    </AppShell>
  );
}
