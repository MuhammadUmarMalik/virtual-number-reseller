import { FoundationPage } from "@/components/foundation-page";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <FoundationPage
        title="Privacy"
        description="Privacy route is ready for data protection, retention, and OTP redaction policy content."
        items={["Encrypted sensitive data", "OTP retention", "KYC document protection", "Audit logs"]}
      />
    </main>
  );
}
