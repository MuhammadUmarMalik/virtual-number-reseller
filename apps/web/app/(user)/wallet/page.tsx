import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function WalletPage() {
  return (
    <AppShell title="Wallet">
      <FoundationPage
        title="Wallet"
        description="The wallet route is ready for authoritative backend balance, top-up entry points, and reconciliation notices."
        items={["PKR balance", "First top-up rule", "Add balance", "Ledger link"]}
      />
    </AppShell>
  );
}
