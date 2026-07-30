"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clipboard,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  FileSearch,
  Loader2,
  Menu,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  Wallet,
  X
} from "lucide-react";
import { Button, cn } from "@number-reseller/ui";
import { adminNavItems, userNavItems } from "@/lib/navigation";
import { apiRequest } from "@/lib/api";

type NavItem = (typeof userNavItems)[number];
type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<StatusTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-sky-200 bg-sky-50 text-sky-700"
};

export function SidebarBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[rgb(var(--accent))] text-white shadow-sm">
        <ShieldCheck className="h-5 w-5" aria-hidden />
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">USA Number</p>
          <p className="truncate text-xs text-slate-500">Reseller platform</p>
        </div>
      ) : null}
    </div>
  );
}

function SidebarNav({ items, collapsed = false, onNavigate }: { items: NavItem[]; collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary navigation" className="space-y-1 p-3">
      {items.map((item) => (
        <Link
          className={cn(
            "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus))]",
            collapsed && "justify-center px-2"
          )}
          href={item.href}
          key={item.href}
          {...(onNavigate ? { onClick: onNavigate } : {})}
          {...(collapsed ? { title: item.label } : {})}
        >
          <item.icon className="h-4 w-4 shrink-0" aria-hidden />
          {!collapsed ? <span className="truncate">{item.label}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

export function UserSidebar({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <aside className={cn("hidden border-r border-slate-200 bg-white lg:block", collapsed ? "w-20" : "w-[250px]")}>
      <SidebarBrand collapsed={collapsed} />
      <SidebarNav items={userNavItems} collapsed={collapsed} />
    </aside>
  );
}

export function AdminSidebar({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <aside className={cn("hidden border-r border-slate-200 bg-white lg:block", collapsed ? "w-20" : "w-[250px]")}>
      <SidebarBrand collapsed={collapsed} />
      <SidebarNav items={adminNavItems} collapsed={collapsed} />
    </aside>
  );
}

export function MobileBottomNavigation() {
  const items = userNavItems.slice(0, 4);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white lg:hidden" aria-label="Mobile primary navigation">
      {items.map((item) => (
        <Link
          className="flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-center text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--focus))]"
          href={item.href}
          key={item.href}
        >
          <item.icon className="h-5 w-5" aria-hidden />
          <span className="max-w-full truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function MobileDrawer({ admin = false, open, onClose }: { admin?: boolean; open: boolean; onClose: () => void }) {
  const panelId = "mobile-navigation-drawer";
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby={`${panelId}-title`}>
      <button className="absolute inset-0 bg-slate-950/35" aria-label="Close navigation" onClick={onClose} />
      <div id={panelId} className="relative h-full w-[min(20rem,88vw)] overflow-y-auto bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 pr-3">
          <div id={`${panelId}-title`} className="sr-only">
            Navigation
          </div>
          <SidebarBrand />
          <Button aria-label="Close navigation" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden />
          </Button>
        </div>
        <SidebarNav items={admin ? adminNavItems : userNavItems} onNavigate={onClose} />
      </div>
    </div>
  );
}

export function WalletBalanceButton({ balance = 0, currency = "PKR", loading = false, disabled = false }: { balance?: number; currency?: string; loading?: boolean; disabled?: boolean }) {
  return (
    <Button variant="secondary" disabled={disabled || loading} className="min-w-0 justify-start">
      <Wallet className="h-4 w-4 shrink-0" aria-hidden />
      {loading ? <span className="h-4 w-24 animate-pulse rounded bg-slate-200" /> : <MoneyDisplay amount={balance} currency={currency} />}
    </Button>
  );
}

export function TopHeader({ title, eyebrow, admin = false, collapsed = false, onToggleSidebar, onOpenDrawer }: { title: string; eyebrow?: string; admin?: boolean; collapsed?: boolean; onToggleSidebar?: () => void; onOpenDrawer?: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button className="lg:hidden" size="icon" variant="ghost" aria-label="Open navigation" onClick={onOpenDrawer}>
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
          <Button className="hidden lg:inline-flex" size="icon" variant="ghost" aria-label="Toggle sidebar" onClick={onToggleSidebar}>
            {collapsed ? <PanelLeftOpen className="h-5 w-5" aria-hidden /> : <PanelLeftClose className="h-5 w-5" aria-hidden />}
          </Button>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase text-slate-500">{eyebrow ?? (admin ? "Admin workspace" : "User workspace")}</p>
            <h1 className="truncate text-lg font-semibold text-slate-950 sm:text-xl">{title}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <SearchInput placeholder="Search orders, numbers..." compact />
          </div>
          <div className="hidden sm:block">
            <WalletBalanceButton balance={12500} />
          </div>
          <NotificationMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export function PageHeader({ title, description, actions, breadcrumbs }: { title: string; description?: string; actions?: React.ReactNode; breadcrumbs?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs}
        <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="mb-2 flex flex-wrap items-center gap-1 text-sm text-slate-500" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          {index > 0 ? <ChevronRight className="h-3.5 w-3.5" aria-hidden /> : null}
          {item.href ? (
            <Link className="font-medium hover:text-slate-950" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="truncate text-slate-700">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function SearchInput({ placeholder = "Search", compact = false, disabled = false, value, onChange, onKeyDown }: { placeholder?: string; compact?: boolean; disabled?: boolean; value?: string; onChange?: React.ChangeEventHandler<HTMLInputElement>; onKeyDown?: React.KeyboardEventHandler<HTMLInputElement> }) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        className={cn(
          "h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
          compact ? "sm:w-56" : "min-w-0"
        )}
        disabled={disabled}
        placeholder={placeholder}
        type="search"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    </label>
  );
}

export function UserMenu({ disabled = false }: { disabled?: boolean }) {
  return (
    <details className="relative">
      <summary aria-label="Open user menu" className={cn("flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus))]", disabled && "pointer-events-none opacity-50")}>
        <UserRound className="h-5 w-5" aria-hidden />
      </summary>
      <div role="menu" className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 text-sm shadow-lg">
        <Link role="menuitem" className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50" href="/profile">Profile</Link>
        <Link role="menuitem" className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50" href="/support">Support</Link>
        <button
          role="menuitem"
          className="w-full rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
          onClick={async () => {
            try {
              await apiRequest("/api/auth/logout", { method: "POST" });
            } finally {
              window.location.assign("/login");
            }
          }}
          type="button"
        >
          Sign out
        </button>
      </div>
    </details>
  );
}

export function NotificationMenu() {
  return (
    <details className="relative">
      <summary aria-label="Open notifications" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus))]">
        <Bell className="h-5 w-5" aria-hidden />
      </summary>
      <div role="menu" className="absolute right-0 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-lg">
        <p className="font-semibold text-slate-950">Notifications</p>
        <p className="mt-2 rounded-md bg-slate-50 p-3 text-slate-600">No unread alerts.</p>
      </div>
    </details>
  );
}

export function StatCard({ label, value, change, tone = "neutral", loading = false, error }: { label: string; value: React.ReactNode; change?: string; tone?: StatusTone; loading?: boolean; error?: string }) {
  return (
    <DataCard className="min-h-32">
      {loading ? <SkeletonCard lines={3} /> : error ? <ErrorState title="Could not load" description={error} compact /> : (
        <>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="mt-3 text-2xl font-semibold text-slate-950">{value}</div>
          {change ? <StatusBadge className="mt-4" tone={tone}>{change}</StatusBadge> : null}
        </>
      )}
    </DataCard>
  );
}

export function DataCard({ children, className, loading = false, empty, error }: { children: React.ReactNode; className?: string; loading?: boolean; empty?: boolean; error?: string | undefined }) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {loading ? <LoadingState compact /> : error ? <ErrorState title="Something went wrong" description={error} compact /> : empty ? <EmptyState title="No data yet" compact /> : children}
    </section>
  );
}

export function EmptyState({ title = "Nothing here yet", description = "New records will appear here when activity starts.", compact = false }: { title?: string; description?: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "py-4" : "min-h-56 py-10")}>
      <FileSearch className="h-8 w-8 text-slate-400" aria-hidden />
      <p className="mt-3 font-semibold text-slate-950">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

export function ErrorState({ title = "Unable to load", description = "Please try again.", compact = false }: { title?: string; description?: string; compact?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-red-200 bg-red-50 p-4", !compact && "min-h-40")}>
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden />
        <div>
          <p className="font-semibold text-red-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-red-700">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function LoadingState({ label = "Loading", compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 text-sm font-medium text-slate-600", compact ? "py-4" : "min-h-40")}>
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function SkeletonCard({ lines = 4 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3" aria-label="Loading preview">
      {Array.from({ length: lines }).map((_, index) => (
        <div className={cn("h-4 rounded bg-slate-200", index === 0 ? "w-2/5" : index === lines - 1 ? "w-3/5" : "w-full")} key={index} />
      ))}
    </div>
  );
}

export function StatusBadge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: StatusTone; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", toneClasses[tone], className)}>{children}</span>;
}

export function MoneyDisplay({ amount, currency = "PKR" }: { amount: number; currency?: string }) {
  return <span className="tabular-nums">{new Intl.NumberFormat("en-PK", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)}</span>;
}

export function ConfirmationDialog({ open, title, description, confirmLabel = "Confirm", danger = false, onCancel, onConfirm, disabled = false }: { open: boolean; title: string; description: string; confirmLabel?: string; danger?: boolean; onCancel: () => void; onConfirm: () => void; disabled?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
      <button className="absolute inset-0 bg-slate-950/40" aria-label="Cancel confirmation" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <h2 id="confirm-title" className="text-lg font-semibold text-slate-950">{title}</h2>
        <p id="confirm-description" className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={disabled}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export function FormField({ label, error, hint, children, id }: { label: string; error?: string | undefined; hint?: string; children: React.ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>; id: string }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const describedByProps = describedBy ? { "aria-describedby": describedBy } : {};
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700" htmlFor={id}>{label}</label>
      {React.cloneElement(children, { id, "aria-invalid": Boolean(error), ...describedByProps })}
      {hint && !error ? <p id={`${id}-hint`} className="text-xs text-slate-500">{hint}</p> : null}
      {error ? <p id={`${id}-error`} className="text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}

export function PasswordField({ id = "password", label = "Password", error, disabled = false }: { id?: string; label?: string; error?: string | undefined; disabled?: boolean }) {
  const [visible, setVisible] = React.useState(false);
  return (
    <FormField id={id} label={label} error={error}>
      <div className="relative">
        <input className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/20 disabled:bg-slate-100" disabled={disabled} type={visible ? "text" : "password"} />
        <button className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" type="button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible((value) => !value)} disabled={disabled}>
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    </FormField>
  );
}

export function PhoneInput({ id = "phone", label = "Phone number", disabled = false, error }: { id?: string; label?: string; disabled?: boolean; error?: string | undefined }) {
  return (
    <FormField id={id} label={label} error={error} hint="Use international format.">
      <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-[rgb(var(--accent))] focus-within:ring-2 focus-within:ring-[rgb(var(--accent))]/20">
        <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">+92</span>
        <input className="h-10 min-w-0 flex-1 px-3 text-sm outline-none disabled:bg-slate-100" disabled={disabled} type="tel" placeholder="300 1234567" />
      </div>
    </FormField>
  );
}

export function QuantitySelector({ value, onChange, min = 1, max = 100, disabled = false }: { value: number; onChange: (value: number) => void; min?: number; max?: number; disabled?: boolean }) {
  return (
    <div className="inline-flex w-full max-w-xs items-center rounded-lg border border-slate-300 bg-white p-1">
      <Button aria-label="Decrease quantity" size="icon" variant="ghost" disabled={disabled || value <= min} onClick={() => onChange(Math.max(min, value - 1))}><Minus className="h-4 w-4" aria-hidden /></Button>
      <input className="h-9 min-w-0 flex-1 text-center text-sm font-semibold tabular-nums outline-none disabled:bg-white" aria-label="Quantity" disabled={disabled} min={min} max={max} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <Button aria-label="Increase quantity" size="icon" variant="ghost" disabled={disabled || value >= max} onClick={() => onChange(Math.min(max, value + 1))}><Plus className="h-4 w-4" aria-hidden /></Button>
    </div>
  );
}

type Option = { label: string; value: string; description?: string };

function Selector({ label, options, disabled = false }: { label: string; options: Option[]; disabled?: boolean }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button className="rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-[rgb(var(--accent))] hover:bg-sky-50/40 focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus))] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" disabled={disabled} key={option.value} type="button">
            <span className="block truncate text-sm font-semibold text-slate-950">{option.label}</span>
            {option.description ? <span className="mt-1 block truncate text-xs text-slate-500">{option.description}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ServiceSelector(props: { options: Option[]; disabled?: boolean }) {
  return <Selector label="Service" {...props} />;
}

export function CountrySelector(props: { options: Option[]; disabled?: boolean }) {
  return <Selector label="Country" {...props} />;
}

export function PriceSummary({ rows, total, loading = false, error }: { rows: Array<{ label: string; value: React.ReactNode }>; total: React.ReactNode; loading?: boolean; error?: string | undefined }) {
  return (
    <DataCard loading={loading} error={error}>
      <h3 className="font-semibold text-slate-950">Price summary</h3>
      <dl className="mt-4 space-y-3 text-sm">
        {rows.map((row) => (
          <div className="flex justify-between gap-4" key={row.label}>
            <dt className="text-slate-600">{row.label}</dt>
            <dd className="text-right font-medium text-slate-950">{row.value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base">
          <dt className="font-semibold text-slate-950">Total</dt>
          <dd className="text-right font-semibold text-slate-950">{total}</dd>
        </div>
      </dl>
    </DataCard>
  );
}

export function PaymentMethodCard({ name, description, selected = false, disabled = false }: { name: string; description: string; selected?: boolean; disabled?: boolean }) {
  return (
    <button className={cn("flex w-full items-center gap-3 rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-[rgb(var(--accent))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus))] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500", selected ? "border-[rgb(var(--accent))] ring-2 ring-[rgb(var(--accent))]/15" : "border-slate-200")} disabled={disabled} type="button" aria-pressed={selected}>
      <CreditCard className="h-5 w-5 shrink-0 text-[rgb(var(--accent))]" aria-hidden />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-950">{name}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      {selected ? <Check className="ml-auto h-5 w-5 text-[rgb(var(--success))]" aria-hidden /> : null}
    </button>
  );
}

export function DataTable({ columns, rows, empty = false, loading = false, error }: { columns: string[]; rows: string[][]; empty?: boolean; loading?: boolean; error?: string | undefined }) {
  if (loading || error || empty) return <DataCard loading={loading} error={error} empty={empty}><span /></DataCard>;
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 p-3 sm:hidden">
        {rows.map((row, rowIndex) => (
          <article className="rounded-lg border border-slate-200 p-3" key={rowIndex}>
            <dl className="grid gap-2 text-sm">
              {row.map((cell, cellIndex) => (
                <div className="grid gap-1" key={`${columns[cellIndex]}-${cellIndex}`}>
                  <dt className="text-xs font-medium uppercase text-slate-500">{columns[cellIndex]}</dt>
                  <dd className="min-w-0 break-words font-medium text-slate-800">{cell}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <caption className="sr-only">Data table</caption>
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>{columns.map((column) => <th className="whitespace-nowrap px-4 py-3" scope="col" key={column}>{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row, rowIndex) => (
              <tr className="hover:bg-slate-50" key={rowIndex}>
                {row.map((cell, cellIndex) => <td className="max-w-xs px-4 py-3 text-slate-700" data-label={columns[cellIndex]} key={`${cell}-${cellIndex}`}><span className="break-words">{cell}</span></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MobileDataCard({ title, rows, status }: { title: string; rows: Array<{ label: string; value: React.ReactNode }>; status?: React.ReactNode }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words font-semibold text-slate-950">{title}</h3>
        {status}
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        {rows.map((row) => (
          <div className="flex justify-between gap-4" key={row.label}>
            <dt className="text-slate-500">{row.label}</dt>
            <dd className="min-w-0 text-right font-medium text-slate-800">{row.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function Pagination({ page = 1, totalPages = 10, disabled = false, onFirst, onPrev, onNext }: { page?: number; totalPages?: number; disabled?: boolean; onFirst?: () => void; onPrev?: () => void; onNext?: () => void }) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Pagination">
      <p className="text-sm text-slate-600">Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span></p>
      <div className="flex gap-1">
        <Button size="icon" variant="secondary" aria-label="First page" disabled={disabled || !onFirst} onClick={onFirst}><ChevronsLeft className="h-4 w-4" aria-hidden /></Button>
        <Button size="icon" variant="secondary" aria-label="Previous page" disabled={disabled || !onPrev} onClick={onPrev}><ChevronLeft className="h-4 w-4" aria-hidden /></Button>
        <Button size="icon" variant="secondary" aria-label="Next page" disabled={disabled || !onNext} onClick={onNext}><ChevronRight className="h-4 w-4" aria-hidden /></Button>
      </div>
    </nav>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">{children}</div>;
}

export function DateRangeFilter({ disabled = false }: { disabled?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <FormField id="date-from" label="From"><input className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" disabled={disabled} type="date" /></FormField>
      <FormField id="date-to" label="To"><input className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" disabled={disabled} type="date" /></FormField>
    </div>
  );
}

export function CopyButton({ value, disabled = false }: { value: string; disabled?: boolean }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button size="sm" variant="secondary" disabled={disabled} onClick={async () => { await navigator.clipboard?.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1400); }}>
      {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function CountdownTimer({ seconds = 420 }: { seconds?: number }) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return <span className="font-mono text-sm font-semibold tabular-nums text-slate-950" aria-label={`${minutes} minutes ${rest} seconds remaining`}>{minutes}:{String(rest).padStart(2, "0")}</span>;
}

export function OTPDisplay({ otp, loading = false, error }: { otp?: string; loading?: boolean; error?: string }) {
  if (loading) return <LoadingState label="Waiting for OTP" compact />;
  if (error) return <ErrorState title="OTP unavailable" description={error} compact />;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <Clipboard className="h-5 w-5 text-slate-500" aria-hidden />
      <span className="font-mono text-xl font-semibold tracking-normal text-slate-950">{otp ?? "Pending"}</span>
      {otp ? <CopyButton value={otp} /> : <StatusBadge tone="warning">Waiting</StatusBadge>}
    </div>
  );
}

export function ActivationStatusTimeline({ steps }: { steps: Array<{ label: string; status: "done" | "current" | "pending" | "error" }> }) {
  return (
    <ol className="space-y-3" aria-label="Activation status">
      {steps.map((step) => (
        <li className="flex gap-3" key={step.label}>
          <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs", step.status === "done" && "border-emerald-600 bg-emerald-600 text-white", step.status === "current" && "border-[rgb(var(--accent))] bg-sky-50 text-[rgb(var(--accent))]", step.status === "pending" && "border-slate-300 bg-white text-slate-400", step.status === "error" && "border-red-600 bg-red-50 text-red-700")}>{step.status === "done" ? <Check className="h-3.5 w-3.5" aria-hidden /> : ""}</span>
          <span className="text-sm font-medium text-slate-700">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

export function AuditDetailsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="audit-title">
      <button className="absolute inset-0 bg-slate-950/35" aria-label="Close audit details" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 id="audit-title" className="text-lg font-semibold text-slate-950">Audit details</h2>
          <Button aria-label="Close audit details" size="icon" variant="ghost" onClick={onClose}><X className="h-5 w-5" aria-hidden /></Button>
        </div>
        <dl className="mt-5 space-y-4 text-sm">
          {[
            ["Actor", "admin@smsotps.com"],
            ["Action", "Wallet adjustment reviewed"],
            ["Request ID", "req_9dnw72"],
            ["Result", "Approved with ledger entry"]
          ].map(([label, value]) => (
            <div className="rounded-lg border border-slate-200 p-3" key={label}>
              <dt className="text-xs font-medium uppercase text-slate-500">{label}</dt>
              <dd className="mt-1 break-words font-medium text-slate-950">{value}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}

export function AppShell({ children, title, eyebrow = "User workspace", admin = false }: { children: React.ReactNode; title: string; eyebrow?: string; admin?: boolean }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  return (
    <div className="flex min-h-screen bg-slate-50">
      {admin ? <AdminSidebar collapsed={collapsed} /> : <UserSidebar collapsed={collapsed} />}
      <div className="min-w-0 flex-1">
        <TopHeader title={title} eyebrow={eyebrow} admin={admin} collapsed={collapsed} onToggleSidebar={() => setCollapsed((value) => !value)} onOpenDrawer={() => setDrawerOpen(true)} />
        <MobileDrawer admin={admin} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <main className="mx-auto w-full max-w-screen-2xl px-4 py-6 pb-24 sm:px-6 lg:pb-8">{children}</main>
        {!admin ? <MobileBottomNavigation /> : null}
      </div>
    </div>
  );
}
