"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@number-reseller/ui";
import {
  ActivationStatusTimeline,
  AdminSidebar,
  AppShell,
  AuditDetailsDrawer,
  Breadcrumbs,
  ConfirmationDialog,
  CopyButton,
  CountdownTimer,
  CountrySelector,
  DataCard,
  DataTable,
  DateRangeFilter,
  EmptyState,
  ErrorState,
  FilterBar,
  FormField,
  LoadingState,
  MobileBottomNavigation,
  MobileDataCard,
  MobileDrawer,
  MoneyDisplay,
  NotificationMenu,
  OTPDisplay,
  PageHeader,
  Pagination,
  PasswordField,
  PaymentMethodCard,
  PhoneInput,
  PriceSummary,
  QuantitySelector,
  SearchInput,
  ServiceSelector,
  SkeletonCard,
  StatCard,
  StatusBadge,
  TopHeader,
  UserMenu,
  UserSidebar,
  WalletBalanceButton
} from "@/components/design-system";

const services = [
  { label: "WhatsApp", value: "wa", description: "High availability, instant activation" },
  { label: "Telegram", value: "tg", description: "Bulk supported" }
];

const countries = [
  { label: "United States", value: "us", description: "+1, multiple carriers" },
  { label: "United Kingdom", value: "gb", description: "+44, selected carriers" }
];

export function DesignSystemReview() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [auditOpen, setAuditOpen] = React.useState(false);
  const [quantity, setQuantity] = React.useState(3);

  return (
    <AppShell title="Design System" eyebrow="Development review">
      <PageHeader
        title="Reusable component system"
        description="Every foundation component is shown with representative loading, empty, error, disabled, success, long-content, and mobile-safe states."
        breadcrumbs={<Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Design System" }]} />}
        actions={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open drawer</Button>
            <Button onClick={() => setConfirmOpen(true)}><Plus className="h-4 w-4" aria-hidden /> Confirm action</Button>
          </>
        }
      />

      <div className="grid gap-6">
        <Section title="Navigation and Shell">
          <div className="grid gap-4 lg:grid-cols-2">
            <DataCard><TopHeader title="Header preview" eyebrow="Sticky header" onOpenDrawer={() => setDrawerOpen(true)} /></DataCard>
            <DataCard><div className="flex gap-4 overflow-x-auto"><UserSidebar /><AdminSidebar collapsed /></div></DataCard>
            <DataCard><MobileBottomNavigation /></DataCard>
            <DataCard><MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} /></DataCard>
          </div>
        </Section>

        <Section title="Headers, Menus, Search">
          <div className="grid gap-4 lg:grid-cols-3">
            <DataCard><WalletBalanceButton balance={12500} /></DataCard>
            <DataCard><SearchInput placeholder="Search a long order number or phone number" /></DataCard>
            <DataCard><div className="flex gap-2"><UserMenu /><NotificationMenu /></div></DataCard>
          </div>
        </Section>

        <Section title="Data States">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Wallet balance" value={<MoneyDisplay amount={12500} />} change="+12% this week" tone="success" />
            <StatCard label="Active numbers" value="18" change="3 expiring soon" tone="warning" />
            <StatCard label="Loading metric" value="" loading />
            <StatCard label="Error metric" value="" error="The reporting service timed out." />
            <DataCard empty><span /></DataCard>
            <DataCard error="Unable to load the ledger."><span /></DataCard>
            <DataCard loading><span /></DataCard>
            <DataCard><SkeletonCard /></DataCard>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <EmptyState />
            <ErrorState description="The request failed with a recoverable server error." />
            <LoadingState label="Loading activations" />
          </div>
        </Section>

        <Section title="Forms and Purchase Controls">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <DataCard>
              <div className="grid gap-4">
                <FormField id="email" label="Email" hint="Used for account verification.">
                  <input className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" type="email" placeholder="customer@example.com" />
                </FormField>
                <PasswordField />
                <PhoneInput error="Enter a valid mobile number." />
                <QuantitySelector value={quantity} onChange={setQuantity} />
                <div className="opacity-60"><QuantitySelector value={1} onChange={setQuantity} disabled /></div>
              </div>
            </DataCard>
            <div className="grid gap-4">
              <DataCard><ServiceSelector options={services} /></DataCard>
              <DataCard><CountrySelector options={countries} /></DataCard>
              <PriceSummary rows={[{ label: "Unit price", value: <MoneyDisplay amount={240} /> }, { label: "Quantity", value: quantity }, { label: "Bulk discount", value: "-PKR 80.00" }]} total={<MoneyDisplay amount={640} />} />
            </div>
          </div>
        </Section>

        <Section title="Payments, Filters, and Tables">
          <div className="grid gap-4 lg:grid-cols-2">
            <DataCard>
              <div className="grid gap-3">
                <PaymentMethodCard name="JazzCash" description="Redirects through a verified merchant checkout." selected />
                <PaymentMethodCard name="Easypaisa" description="Available after backend payment adapter setup." disabled />
              </div>
            </DataCard>
            <DataCard>
              <FilterBar>
                <div className="min-w-0 flex-1"><SearchInput placeholder="Filter ledger entries" /></div>
                <DateRangeFilter />
              </FilterBar>
            </DataCard>
          </div>
          <DataTable
            columns={["Order", "Service", "Status", "Long Reference", "Amount"]}
            rows={[
              ["ORD-10041", "WhatsApp", "OTP_RECEIVED", "req_with_a_very_long_reference_that_wraps_safely_inside_the_cell", "PKR 240.00"],
              ["ORD-10042", "Telegram", "WAITING_FOR_OTP", "vendor-normalized-activation-98515", "PKR 210.00"]
            ]}
          />
          <Pagination />
          <div className="grid gap-4 md:grid-cols-2">
            <MobileDataCard title="ORD-10041 with a long customer-facing activation title" status={<StatusBadge tone="success">Success</StatusBadge>} rows={[{ label: "Service", value: "WhatsApp" }, { label: "Amount", value: <MoneyDisplay amount={240} /> }]} />
            <MobileDataCard title="ORD-10042" status={<StatusBadge tone="warning">Waiting</StatusBadge>} rows={[{ label: "Service", value: "Telegram" }, { label: "Amount", value: <MoneyDisplay amount={210} /> }]} />
          </div>
        </Section>

        <Section title="Activation and Admin Details">
          <div className="grid gap-4 lg:grid-cols-3">
            <DataCard><OTPDisplay otp="845120" /></DataCard>
            <DataCard><OTPDisplay loading /></DataCard>
            <DataCard><div className="flex flex-wrap items-center gap-3"><CountdownTimer seconds={425} /><CopyButton value="+17799042123" /><StatusBadge tone="info">Reserved</StatusBadge></div></DataCard>
            <DataCard><ActivationStatusTimeline steps={[{ label: "Reserved", status: "done" }, { label: "Waiting for OTP", status: "current" }, { label: "Completed", status: "pending" }, { label: "Refunded", status: "pending" }]} /></DataCard>
            <DataCard><Button variant="secondary" onClick={() => setAuditOpen(true)}>Open audit details</Button></DataCard>
            <DataCard><StatusBadge tone="danger">Suspended account requiring review</StatusBadge></DataCard>
          </div>
        </Section>
      </div>

      <ConfirmationDialog open={confirmOpen} title="Confirm purchase" description="The backend will recalculate the final amount before creating the order and debiting the wallet." onCancel={() => setConfirmOpen(false)} onConfirm={() => setConfirmOpen(false)} />
      <AuditDetailsDrawer open={auditOpen} onClose={() => setAuditOpen(false)} />
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      {children}
    </section>
  );
}
