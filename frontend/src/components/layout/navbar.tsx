"use client";

import { Menu, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useWallet } from "@/hooks/use-wallet";
import { useAppStore } from "@/store/app.store";
import { formatCurrency } from "@/lib/format-currency";

interface NavbarProps {
  onMenuClick?: () => void;
  showBalance?: boolean;
}

export function Navbar({ onMenuClick, showBalance = true }: NavbarProps) {
  const { wallet } = useWallet();
  const balance = wallet?.balance ?? null;
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

  const handleMenu = () => {
    if (onMenuClick) {
      onMenuClick();
    } else {
      toggleSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={handleMenu}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {showBalance && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            <Wallet className="h-4 w-4" />
            {balance === null ? "—" : formatCurrency(balance)}
          </div>
        )}
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
