"use client";

import { useState } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionTable } from "@/components/wallet/transaction-table";
import { WalletCard } from "@/components/wallet/wallet-card";
import { TopupModal } from "@/components/wallet/topup-modal";
import { useWallet, useWalletTransactions } from "@/hooks/use-wallet";

export default function WalletPage() {
  const [showTopup, setShowTopup] = useState(false);
  const { wallet, isLoading, isError, error } = useWallet();
  const transactionsQuery = useWalletTransactions({ limit: 50 });

  if (isLoading) {
    return <LoadingState label="Loading wallet..." />;
  }

  if (isError || !wallet) {
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : "Unable to load your wallet."
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Wallet"
        description="Manage your balance and top up"
      />

      <WalletCard
        balance={wallet.balance}
        totalDeposits={wallet.totalDeposits}
        totalPurchases={wallet.totalPurchases}
        totalRefunds={wallet.totalRefunds}
        onTopUp={() => setShowTopup(true)}
      />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Recent Transactions
        </h2>
        {transactionsQuery.isLoading ? (
          <LoadingState label="Loading transactions..." variant="table" rows={5} />
        ) : transactionsQuery.isError ? (
          <ErrorState message="Unable to load transactions." />
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <TransactionTable transactions={transactionsQuery.data?.items ?? []} />
          </div>
        )}
      </section>

      {showTopup && <TopupModal onClose={() => setShowTopup(false)} />}
    </div>
  );
}
