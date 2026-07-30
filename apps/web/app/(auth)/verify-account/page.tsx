import { VerifyAccount } from "@/components/auth/verify-account";

export default async function VerifyAccountPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <VerifyAccount token={token} />;
}
