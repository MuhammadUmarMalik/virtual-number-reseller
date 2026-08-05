"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: string;
}

interface SidebarProps {
  items: SidebarNavItem[];
  footer?: React.ReactNode;
  brand?: string;
}

export function Sidebar({ items, footer, brand = "Number Reseller" }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <Link href="/" className="text-lg font-bold text-slate-900">
          {brand}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const match = item.matchPrefix ?? item.href;
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${match}/`) ||
            (match !== "/" && pathname.startsWith(match));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {footer && <div className="border-t border-slate-200 p-4">{footer}</div>}
    </aside>
  );
}
