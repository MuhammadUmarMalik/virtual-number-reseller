import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  checkOtp,
  completeActivation,
  requestAnotherSms,
} from "@/services/number.service";
import type { PurchasedNumberStatus } from "@/types/number.types";

const TERMINAL_STATUSES: PurchasedNumberStatus[] = [
  "EXPIRED",
  "REFUNDED",
  "DISABLED",
];

export function useActivationPolling(
  numberId: string,
  initialStatus: PurchasedNumberStatus
) {
  return useQuery({
    queryKey: ["number-otp", numberId],
    queryFn: () => checkOtp(numberId),
    enabled: Boolean(numberId) && !TERMINAL_STATUSES.includes(initialStatus),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && TERMINAL_STATUSES.includes(status)) return false;
      if (status === "RECEIVED") return 20_000;
      return 12_000;
    },
    refetchIntervalInBackground: false,
    retry: 1,
  });
}

export function useRequestAnotherSms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestAnotherSms,
    onSuccess: (_data, numberId) => {
      queryClient.invalidateQueries({ queryKey: ["numbers"] });
      queryClient.invalidateQueries({ queryKey: ["number-otp", numberId] });
    },
  });
}

export function useCompleteActivation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeActivation,
    onSuccess: (_data, numberId) => {
      queryClient.invalidateQueries({ queryKey: ["numbers"] });
      queryClient.invalidateQueries({ queryKey: ["number-otp", numberId] });
    },
  });
}
