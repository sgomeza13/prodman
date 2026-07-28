import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetSales, CreateSale, GetSalesReport } from "../../wailsjs/go/main/App";
import { domain } from "../../wailsjs/go/models";
import { PRODUCT_KEYS } from "./useProducts";

export const SALE_KEYS = {
  all: ["sales"] as const,
};

export type ReportGranularity = "daily" | "weekly" | "monthly";

export function useSales(limit = 100) {
  return useQuery({
    queryKey: [...SALE_KEYS.all, "list", limit],
    queryFn: async (): Promise<domain.Sale[]> => {
      const data = await GetSales(limit);
      return data || [];
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sale: domain.Sale) => CreateSale(sale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALE_KEYS.all });
      // stock changed
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}

export function useSalesReport(granularity: ReportGranularity, limit = 60) {
  return useQuery({
    queryKey: [...SALE_KEYS.all, "report", granularity, limit],
    queryFn: async (): Promise<domain.ReportRow[]> => {
      const data = await GetSalesReport(granularity, limit);
      return data || [];
    },
  });
}
