"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    if (!sidebarOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen, setSidebarOpen]);

  if (!sidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <div className="relative h-full">
        <div className="flex h-full">
          <Sidebar items={items} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute left-[17rem] top-4 bg-card/50 text-foreground backdrop-blur-sm"
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
