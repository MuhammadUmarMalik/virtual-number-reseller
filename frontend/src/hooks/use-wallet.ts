import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getWallet, getWalletTransactions } from "@/services/wallet.service";
import { useWalletStore } from "@/store/wallet.store";

export function useWallet() {
  const queryClient = useQueryClient();
  const setBalance = useWalletStore((state) => state.setBalance);

  const query = useQuery({
    queryKey: ["wallet"],
    queryFn: getWallet,
  });

  useEffect(() => {
    if (query.data) {
      setBalance(query.data.balance);
    }
  }, [query.data, setBalance]);

  return {
    wallet: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  };
}

export function useWalletTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["wallet", "transactions", params ?? {}],
    queryFn: () => getWalletTransactions(params),
  });
}

export function useWalletBalance() {
  return useWalletStore((state) => state.balance);
}
