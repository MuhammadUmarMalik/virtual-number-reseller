import { FoundationPage } from "@/components/foundation-page";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <FoundationPage
        title="Terms"
        description="Terms of service route is ready for the compliance content module."
        items={["Lawful use terms", "Wallet terms", "Refund policy", "KYC obligations"]}
      />
    </main>
  );
}
