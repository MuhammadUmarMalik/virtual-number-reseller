import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  return (
    <AuthShell title="Welcome back" description="Sign in to manage your wallet, numbers, and account security.">
      <LoginForm redirectTo={redirect} />
    </AuthShell>
  );
}
