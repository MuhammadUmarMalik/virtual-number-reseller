import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" description="Enter your email. If an account exists, we’ll send a secure, single-use reset link.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
