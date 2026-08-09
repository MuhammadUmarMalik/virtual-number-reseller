import { ArrowRight, CheckCircle2, Copy, MessageSquareText, Wallet } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const trustPoints = [
  "No SIM card required",
  "Admin-verified top-ups",
  "Refund window on every purchase",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-landing-grid [mask-image:radial-gradient(ellipse_80%_70%_at_50%_0%,black_35%,transparent_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-2 lg:gap-10 lg:pb-28">
        <div className="max-w-xl">
          <Badge className="mb-5">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            USA virtual numbers · Instant OTP delivery
          </Badge>
          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Rent a US number. Get your OTP in seconds.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Buy disposable USA phone numbers for verification, app testing and
            sign-ups. Top up your wallet, pick a number, and receive OTPs from
            your dashboard — no SIM card needed.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
            {trustPoints.map((point) => (
              <li
                key={point}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <Card className="relative mx-auto w-full max-w-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessageSquareText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">United States · instant</p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
              <span className="font-mono text-lg font-semibold tracking-tight text-foreground">
                +1 (202) 555-0148
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                <Copy className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  OTP received
                </p>
                <span className="font-mono text-sm font-semibold tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
                  482 913
                </span>
              </div>
            </div>

            <Button type="button" size="sm" className="mt-4 w-full">
              Check OTP
            </Button>
          </Card>

          <div className="absolute -right-4 -top-8 hidden w-44 rounded-xl border border-border bg-card p-4 shadow-lg lg:block">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wallet className="h-4 w-4" />
              </span>
              <p className="text-xs text-muted-foreground">Wallet balance</p>
            </div>
            <p className="mt-2 font-mono text-lg font-semibold tracking-tight text-foreground">
              $24.80
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
