import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  checkOtp,
  getActiveNumbers,
} from "@/services/number.service";

export function useActiveNumbers(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ["numbers", params ?? {}],
    queryFn: () => getActiveNumbers(params),
  });
}

export function useCheckOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkOtp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["numbers"] });
      queryClient.invalidateQueries({ queryKey: ["otp-history"] });
    },
  });
}
