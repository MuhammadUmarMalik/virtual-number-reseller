import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Choose a new password" description="This will sign out all existing sessions on your account.">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
