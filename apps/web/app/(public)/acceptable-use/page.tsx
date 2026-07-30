import { FoundationPage } from "@/components/foundation-page";

export default function AcceptableUsePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <FoundationPage
        title="Acceptable Use"
        description="Acceptable-use policy route is ready for lawful, authorised verification constraints."
        items={["Blocked services", "Purchase limits", "Abuse reporting", "Account suspension"]}
      />
    </main>
  );
}
