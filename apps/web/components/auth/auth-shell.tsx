import Link from "next/link";
import { ShieldCheck, WalletCards } from "lucide-react";

export function AuthShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(30rem,0.8fr)]">
      <section className="hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link className="flex items-center gap-3 font-semibold" href="/">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          USA Number
        </Link>
        <div className="max-w-xl">
          <div className="mb-7 grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
            <WalletCards className="h-7 w-7 text-sky-300" aria-hidden />
          </div>
          <p className="text-4xl font-semibold leading-tight">Secure access to your number workspace.</p>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Verified accounts, protected wallet sessions, and clear controls for lawful, authorised use.
          </p>
        </div>
        <p className="text-xs text-slate-400">Protected by rotating sessions and account-level security controls.</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link className="mb-9 flex items-center gap-2 font-semibold text-slate-950 lg:hidden" href="/">
            <ShieldCheck className="h-6 w-6 text-sky-700" aria-hidden />
            USA Number
          </Link>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
