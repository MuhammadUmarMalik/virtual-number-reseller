"use client";

import type { ReactNode } from "react";
import {
  Activity,
  BookOpen,
  Clock,
  LayoutDashboard,
  Settings,
  Wallet,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { SidebarNavItem } from "@/components/layout/sidebar";

const navItems: SidebarNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/active-numbers", label: "Active Numbers", icon: Activity },
  { href: "/orders", label: "My Orders", icon: BookOpen },
  { href: "/otp-history", label: "OTP History", icon: Clock },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/updates", label: "Updates", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <DashboardShell items={navItems}>
      {children}
    </DashboardShell>
  );
}
