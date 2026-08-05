"use client";

import { Menu, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={handleMenu}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      {showBalance && (
        <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
          <Wallet className="h-4 w-4" />
          {balance === null ? "—" : formatCurrency(balance)}
        </div>
      )}
    </header>
  );
}
