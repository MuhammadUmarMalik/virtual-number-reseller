import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminKycPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="KYC">
      <FoundationPage
        title="KYC review"
        description="Ready for encrypted document references, review queues, approval, rejection, and rejection reasons."
        items={["Pending", "Verified", "Rejected", "Reviewer note"]}
      />
    </AppShell>
  );
}
