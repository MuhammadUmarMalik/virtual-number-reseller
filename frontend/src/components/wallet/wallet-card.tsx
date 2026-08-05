import { Wallet } from "lucide-react";

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
    <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          <span className="text-sm font-medium text-indigo-100">Wallet Balance</span>
        </div>
        <Button
          type="button"
          onClick={onTopUp}
          className="bg-white text-indigo-700 hover:bg-indigo-50 focus-visible:ring-white"
        >
          Top Up
        </Button>
      </div>
      <p className="mt-4 text-3xl font-bold">{formatCurrency(balance)}</p>
      <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-indigo-200">Deposits</p>
          <p className="mt-1 font-semibold">{formatCurrency(totalDeposits)}</p>
        </div>
        <div>
          <p className="text-indigo-200">Purchases</p>
          <p className="mt-1 font-semibold">{formatCurrency(totalPurchases)}</p>
        </div>
        <div>
          <p className="text-indigo-200">Refunds</p>
          <p className="mt-1 font-semibold">{formatCurrency(totalRefunds)}</p>
        </div>
      </div>
    </Card>
  );
}
