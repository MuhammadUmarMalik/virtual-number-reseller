"use client";

import Link from "next/link";
import { CheckCircle2, LockKeyhole, Mail, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

interface OnboardingResponse {
  onboarding: {
    accountVerified: boolean;
    initialTopupDone: boolean;
    canPurchase: boolean;
    minimumFirstTopup: number;
    wallet: { balance: string; currency: string };
  };
}

export function OnboardingStatus({ purchasePage = false }: { purchasePage?: boolean }) {
  const [data, setData] = useState<OnboardingResponse["onboarding"]>();
  useEffect(() => {
    void apiRequest<OnboardingResponse>("/api/auth/me").then((result) => setData(result.onboarding));
  }, []);

  if (!data) return <div className="h-44 animate-pulse rounded-xl border border-slate-200 bg-white" aria-label="Loading onboarding status" />;
  if (purchasePage && !data.canPurchase) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <LockKeyhole className="h-8 w-8 text-amber-700" aria-hidden />
        <h2 className="mt-4 text-xl font-semibold text-amber-950">Purchasing is locked</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900">
          Verify your account and complete a first top-up of at least PKR {data.minimumFirstTopup.toLocaleString("en-PK")}. This rule is also enforced by the API.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {!data.accountVerified ? <Link className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950" href="/verify-account">Verify account</Link> : null}
          <Link className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white" href="/wallet/top-up">Add balance</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatusCard icon={<Mail />} label="Account verification" value={data.accountVerified ? "Verified" : "Action needed"} complete={data.accountVerified} />
      <StatusCard icon={<Wallet />} label="Wallet balance" value={`${data.wallet.currency} ${Number(data.wallet.balance).toLocaleString("en-PK")}`} complete={data.initialTopupDone} />
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">First top-up</p>
        <p className="mt-2 text-lg font-semibold text-slate-950">Minimum PKR {data.minimumFirstTopup}</p>
        <Link className="mt-4 inline-flex text-sm font-semibold text-sky-800 hover:underline" href="/wallet/top-up">Add balance →</Link>
      </div>
    </div>
  );
}

function StatusCard({ icon, label, value, complete }: { icon: React.ReactNode; label: string; value: string; complete: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
        {complete ? <CheckCircle2 className="h-5 w-5" /> : icon}
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
