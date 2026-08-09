const steps = [
  {
    step: "01",
    title: "Create your account",
    description:
      "Sign up with your email and WhatsApp number. It takes less than a minute.",
  },
  {
    step: "02",
    title: "Add funds",
    description:
      "Submit a top-up request and an admin verifies your payment, then credits your wallet.",
  },
  {
    step: "03",
    title: "Pick a number",
    description:
      "Choose a US number for your service and confirm the purchase from your wallet.",
  },
  {
    step: "04",
    title: "Receive OTPs",
    description:
      "Check incoming messages from your dashboard and copy codes the moment they arrive.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-muted/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From sign-up to OTP in four steps
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ step, title, description }) => (
            <div key={step} className="relative rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
              <span className="font-mono text-sm font-semibold text-primary">
                {step}
              </span>
              <h3 className="mt-3 font-semibold tracking-tight text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
