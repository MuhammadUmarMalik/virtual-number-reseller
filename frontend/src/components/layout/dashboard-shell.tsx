"use client";

import type { ReactNode } from "react";

import { MobileMenu } from "@/components/layout/mobile-menu";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar, type SidebarNavItem } from "@/components/layout/sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { useAppStore } from "@/store/app.store";

interface DashboardShellProps {
  items: SidebarNavItem[];
  children: ReactNode;
}

export function DashboardShell({ items, children }: DashboardShellProps) {
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:flex">
        <Sidebar
          items={items}
          footer={<UserMenu />}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <MobileMenu items={items} />
    </div>
  );
}
