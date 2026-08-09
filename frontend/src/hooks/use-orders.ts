import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createOrder,
  getOrder,
  getOrders,
} from "@/services/order.service";

export function useOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ["orders", params ?? {}],
    queryFn: () => getOrders(params),
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => getOrder(orderId),
    enabled: Boolean(orderId),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["numbers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
