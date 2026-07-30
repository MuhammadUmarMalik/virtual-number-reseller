import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@number-reseller/ui";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center gap-8">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Lawful verification use only
          </div>
          <h1 className="text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
            USA Number Reseller
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            A wallet-based platform foundation for compliant USA number purchases, OTP status,
            refunds, KYC, purchase limits, and financial audit trails.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
              href="/dashboard"
            >
              Open dashboard
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-950 hover:bg-slate-50"
              href="/login"
            >
              Sign in
            </Link>
          </div>
        </div>
        <Card>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
            {["Wallet ledger", "Vendor adapter", "Payment callbacks"].map((item) => (
              <div className="rounded-lg border border-slate-200 bg-white p-4" key={item}>
                <p className="text-sm font-semibold text-slate-950">{item}</p>
                <p className="mt-2 text-sm text-slate-600">Foundation contract ready.</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
