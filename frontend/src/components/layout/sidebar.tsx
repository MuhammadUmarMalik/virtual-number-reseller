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
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
          {brand}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {footer && <div className="border-t border-border p-4">{footer}</div>}
    </aside>
  );
}
