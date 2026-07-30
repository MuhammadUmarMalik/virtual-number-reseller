import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminAuditLogsPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="Audit Logs">
      <FoundationPage
        title="Audit logs"
        description="Ready for admin actions, financial events, request IDs, before/after data, and security-sensitive events."
        items={["Action", "Actor", "Request ID", "Before and after"]}
      />
    </AppShell>
  );
}
