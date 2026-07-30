import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function WalletTopUpPage() {
  return (
    <AppShell title="Top Up Wallet">
      <FoundationPage
        title="Add balance"
        description="The top-up route is ready for JazzCash, Easypaisa, and mock gateway initiation with backend-only wallet crediting."
        items={["Minimum PKR 500 first top-up", "Gateway selection", "Verified callback", "Duplicate callback handling"]}
      />
    </AppShell>
  );
}
