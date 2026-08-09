import { Phone } from "lucide-react";
import Link from "next/link";

const links = [
  { label: "Sign in", href: "/sign-in" },
  { label: "Create account", href: "/sign-up" },
  { label: "Dashboard", href: "/dashboard" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Phone className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">
              Number Reseller
            </p>
            <p className="text-xs text-muted-foreground">
              US virtual numbers for verification and testing
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {links.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
        <p className="text-xs leading-relaxed text-muted-foreground">
          For lawful verification and testing only. Users are responsible for
          complying with applicable telecom, privacy and anti-spam regulations.
        </p>
      </div>
    </footer>
  );
}
