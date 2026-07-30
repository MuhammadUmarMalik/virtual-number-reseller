"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Mail, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

interface Me {
  user: { email: string; emailVerifiedAt: string | null; phoneVerifiedAt: string | null };
  onboarding: {
    accountVerified: boolean;
    initialTopupDone: boolean;
    canPurchase: boolean;
    minimumFirstTopup: number;
    wallet: { balance: string; currency: string };
  };
}

export function VerifyAccount({ token }: { token?: string | undefined }) {
  const router = useRouter();
  const [data, setData] = useState<Me>();
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (token) await apiRequest("/api/auth/verify/email", { method: "POST", body: JSON.stringify({ token }) });
        const result = await apiRequest<Me>("/api/auth/me");
        if (active) setData(result);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load verification status.");
      }
    }
    void load();
    return () => { active = false; };
  }, [token]);

  if (!data && !error) return <div className="mx-auto mt-24 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-800" aria-label="Loading account status" />;
  if (error) return <div className="mx-auto mt-20 max-w-lg rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error} <Link className="font-semibold underline" href="/login">Sign in</Link></div>;

  const verified = data!.onboarding.accountVerified;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold text-sky-800">ACCOUNT SETUP</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">{verified ? "You’re verified" : "Verify your account"}</h1>
        <p className="mt-3 text-slate-600">Complete these steps before purchasing your first number.</p>
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Step
            complete={verified}
            icon={<Mail className="h-5 w-5" />}
            title="Account verification"
            description={verified ? "Your identity channel is verified." : `We sent a verification link to ${data!.user.email}.`}
          >
            {!verified ? <button disabled={sending} onClick={async () => {
              setSending(true);
              try { await apiRequest("/api/auth/verify/email/request", { method: "POST" }); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to resend."); } finally { setSending(false); }
            }} className="mt-3 text-sm font-semibold text-sky-800 hover:underline">{sending ? "Sending…" : "Resend email"}</button> : null}
          </Step>
          <Step
            complete={data!.onboarding.initialTopupDone}
            icon={<Wallet className="h-5 w-5" />}
            title={`Wallet balance: ${data!.onboarding.wallet.currency} ${Number(data!.onboarding.wallet.balance).toLocaleString("en-PK")}`}
            description={`Your first top-up must be at least PKR ${data!.onboarding.minimumFirstTopup.toLocaleString("en-PK")}. Purchasing stays locked until it succeeds.`}
          >
            <Link className="mt-4 inline-flex h-10 items-center rounded-lg bg-sky-800 px-4 text-sm font-semibold text-white hover:bg-sky-900" href="/wallet/top-up">Add balance</Link>
          </Step>
        </div>
        <div className="mt-5 flex justify-end">
          <button className="text-sm font-semibold text-slate-700 hover:text-slate-950" onClick={() => { router.push("/dashboard"); router.refresh(); }}>Go to dashboard →</button>
        </div>
      </div>
    </main>
  );
}

function Step({ complete, icon, title, description, children }: { complete: boolean; icon: React.ReactNode; title: string; description: string; children?: React.ReactNode }) {
  return (
    <section className="flex gap-4 border-b border-slate-200 p-6 last:border-0">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{complete ? <CheckCircle2 className="h-5 w-5" /> : icon ?? <Circle />}</div>
      <div><h2 className="font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>{children}</div>
    </section>
  );
}
