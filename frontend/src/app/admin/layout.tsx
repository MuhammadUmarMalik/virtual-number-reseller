"use client";

import type { ReactNode } from "react";
import {
  BookOpen,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  Package,
  Phone,
  Receipt,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

import { AdminShell } from "@/components/layout/admin-shell";
import type { SidebarNavItem } from "@/components/layout/sidebar";

const adminNavItems: SidebarNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/topups", label: "Top-Ups", icon: Wallet },
  { href: "/admin/payment-accounts", label: "Payment Accounts", icon: CreditCard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/numbers", label: "Numbers", icon: Phone },
  { href: "/admin/orders", label: "Orders", icon: BookOpen },
  { href: "/admin/refunds", label: "Refunds", icon: Receipt },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <AdminShell items={adminNavItems} title="Admin Panel">
      {children}
    </AdminShell>
  );
}
