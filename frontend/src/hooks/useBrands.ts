import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetBrands, CreateBrand, UpdateBrand, DeleteBrand } from "../../wailsjs/go/main/App";
import { domain } from "../../wailsjs/go/models";

export const BRAND_KEYS = {
  all: ["brands"] as const,
};

export function useBrands() {
  return useQuery({
    queryKey: BRAND_KEYS.all,
    queryFn: async (): Promise<domain.Brand[]> => {
      const data = await GetBrands();
      return data || [];
    },
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brand: domain.Brand) => CreateBrand(brand),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_KEYS.all });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brand: domain.Brand) => UpdateBrand(brand),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_KEYS.all });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => DeleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_KEYS.all });
    },
  });
}
