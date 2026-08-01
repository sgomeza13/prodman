import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetProducts, CreateProduct, UpdateProduct, DeleteProduct, DeleteVariant, PickProductImage } from "../../wailsjs/go/main/App";
import { domain } from "../../wailsjs/go/models";
import { PROVIDER_PRICE_KEYS } from "./useProviders";

export const PRODUCT_KEYS = {
  all: ["products"] as const,
};

export function useProducts() {
  return useQuery({
    queryKey: PRODUCT_KEYS.all,
    queryFn: async (): Promise<domain.Product[]> => {
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
      // saving a variant with provider+cost upserts that provider's quote
      queryClient.invalidateQueries({ queryKey: PROVIDER_PRICE_KEYS.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    // removedVariantIds: variants the user deleted in the edit form
    mutationFn: async ({ product, removedVariantIds = [] }: { product: domain.Product; removedVariantIds?: number[] }) => {
      for (const id of removedVariantIds) {
        await DeleteVariant(id);
      }
      await UpdateProduct(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROVIDER_PRICE_KEYS.all });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => DeleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}

export function usePickProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => PickProductImage(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}
