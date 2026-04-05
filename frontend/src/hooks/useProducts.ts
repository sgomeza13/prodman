import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetProducts, CreateProduct } from "../../wailsjs/go/main/App";
import { domain } from "../../wailsjs/go/models";

export const PRODUCT_KEYS = {
  all: ["products"] as const,
};

export function useProducts() {
  return useQuery({
    queryKey: PRODUCT_KEYS.all,
    queryFn: async () => {
      const data = await GetProducts();
      return data || [];
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: domain.Product) => CreateProduct(product),
    onSuccess: () => {
      // Refresh the products list after a new one is created
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}
