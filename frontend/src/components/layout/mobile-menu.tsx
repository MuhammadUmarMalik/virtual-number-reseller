"use client";

import { X } from "lucide-react";

import { Sidebar, type SidebarNavItem } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app.store";

interface MobileMenuProps {
  items: SidebarNavItem[];
}

export function MobileMenu({ items }: MobileMenuProps) {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

  if (!sidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <div className="relative h-full">
        <div className="flex h-full">
          <Sidebar items={items} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute left-64 top-4 text-white"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
