import { AppShell } from "@/components/app-shell";
import { FoundationPage } from "@/components/foundation-page";

export default function AdminUsersPage() {
  return (
    <AppShell admin eyebrow="Admin workspace" title="Users">
      <FoundationPage
        title="User management"
        description="Ready for user search, account status, suspension, blocking, and admin action reasons."
        items={["Search", "Suspend", "Block", "Audit reason"]}
      />
    </AppShell>
  );
}
