"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { MobileMenu } from "@/components/layout/mobile-menu";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar, type SidebarNavItem } from "@/components/layout/sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { useAppStore } from "@/store/app.store";
import { useAuthStore } from "@/store/auth.store";

interface AdminShellProps {
  items: SidebarNavItem[];
  title: string;
  children: ReactNode;
}

export function AdminShell({ items, title, children }: AdminShellProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

  useEffect(() => {
    if (!isLoading && user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [isLoading, router, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar items={items} brand={title} footer={<UserMenu />} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} showBalance={false} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <MobileMenu items={items} />
    </div>
  );
}
