import { ArrowDownLeft, ArrowUpRight, RotateCcw, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-currency";

interface WalletCardProps {
  balance: string;
  totalDeposits: string;
  totalPurchases: string;
  totalRefunds: string;
  onTopUp: () => void;
}

export function WalletCard({
  balance,
  totalDeposits,
  totalPurchases,
  totalRefunds,
  onTopUp,
}: WalletCardProps) {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary via-primary to-primary/90 p-6 text-primary-foreground sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <span className="text-sm font-medium text-primary-foreground/80">
              Wallet Balance
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {formatCurrency(balance)}
          </p>
        </div>
        <Button
          type="button"
          onClick={onTopUp}
          className="bg-white text-primary shadow-sm hover:bg-primary-foreground/90"
        >
          Top Up
        </Button>
      </div>
      <div className="relative mt-6 grid grid-cols-3 gap-4 border-t border-white/15 pt-5 text-sm">
        <div>
          <p className="flex items-center gap-1.5 text-primary-foreground/70">
            <ArrowDownLeft className="h-3.5 w-3.5" />
            Deposits
          </p>
          <p className="mt-1 font-semibold">{formatCurrency(totalDeposits)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-primary-foreground/70">
            <ArrowUpRight className="h-3.5 w-3.5" />
            Purchases
          </p>
          <p className="mt-1 font-semibold">{formatCurrency(totalPurchases)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-primary-foreground/70">
            <RotateCcw className="h-3.5 w-3.5" />
            Refunds
          </p>
          <p className="mt-1 font-semibold">{formatCurrency(totalRefunds)}</p>
        </div>
      </div>
    </Card>
  );
}
