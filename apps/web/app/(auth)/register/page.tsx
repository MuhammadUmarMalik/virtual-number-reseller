import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/auth-forms";

export default function RegisterPage() {
  return (
    <AuthShell title="Create your account" description="Your wallet starts at PKR 0. Verify your account before your first top-up.">
      <RegisterForm />
    </AuthShell>
  );
}
