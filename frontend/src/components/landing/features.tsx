import {
  History,
  KeyRound,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Instant virtual numbers",
    description:
      "Real US numbers assigned in seconds for verification, testing and account sign-ups.",
  },
  {
    icon: KeyRound,
    title: "OTP auto-delivery",
    description:
      "Messages are checked and OTP codes are extracted automatically and shown on your dashboard.",
  },
  {
    icon: Wallet,
    title: "Prepaid wallet",
    description:
      "Top up through admin-verified deposits and spend only on what you need.",
  },
  {
    icon: History,
    title: "Full OTP history",
    description:
      "Every message and code is kept in one place so you never lose a verification.",
  },
  {
    icon: ShieldCheck,
    title: "Refund window",
    description:
      "If a number under-delivers, request a refund within the allowed window.",
  },
  {
    icon: MonitorSmartphone,
    title: "Active numbers dashboard",
    description:
      "Manage every purchased number, check status and copy codes from a single view.",
  },
];

export function Features() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Why Number Reseller
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Everything you need to receive OTPs
        </h2>
        <p className="mt-4 text-muted-foreground">
          A focused tool for developers, testers and anyone who needs a US number
          fast — with wallet balance you control.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold tracking-tight text-foreground">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
