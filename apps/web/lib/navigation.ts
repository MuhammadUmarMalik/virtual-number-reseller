import {
  BadgeCheck,
  BarChart3,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FileClock,
  Gauge,
  Globe2,
  Headphones,
  Landmark,
  ListChecks,
  Logs,
  Phone,
  ReceiptText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UsersRound,
  Wallet
} from "lucide-react";

export const userNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/buy-number", label: "Buy Number", icon: Phone },
  { href: "/my-numbers", label: "My Numbers", icon: BadgeCheck },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/support", label: "Support", icon: Headphones }
];

export const adminNavItems = [
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: UsersRound },
  { href: "/admin/kyc", label: "KYC", icon: BadgeCheck },
  { href: "/admin/wallets", label: "Wallets", icon: Wallet },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/activations", label: "Activations", icon: FileClock },
  { href: "/admin/vendors", label: "Vendors", icon: Landmark },
  { href: "/admin/services", label: "Services", icon: ListChecks },
  { href: "/admin/countries", label: "Countries", icon: Globe2 },
  { href: "/admin/pricing", label: "Pricing", icon: CircleDollarSign },
  { href: "/admin/refunds", label: "Refunds", icon: ReceiptText },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: Logs },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/wallet/top-up", label: "Top Up", icon: SlidersHorizontal }
];
