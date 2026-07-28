import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetPurchases, RecordPurchase } from "../../wailsjs/go/main/App";
import { domain } from "../../wailsjs/go/models";
import { PRODUCT_KEYS } from "./useProducts";

export const PURCHASE_KEYS = {
  all: ["purchases"] as const,
};

export function usePurchases(limit = 50) {
  return useQuery({
    queryKey: [...PURCHASE_KEYS.all, limit],
    queryFn: async (): Promise<domain.Purchase[]> => {
      const data = await GetPurchases(limit);
      return data || [];
    },
  });
}

export function useRecordPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ purchase, acceptedPrice }: { purchase: domain.Purchase; acceptedPrice: number }) =>
      RecordPurchase(purchase, acceptedPrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASE_KEYS.all });
      // stock and cost changed
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}
