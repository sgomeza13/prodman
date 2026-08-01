import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GetProviders,
  CreateProvider,
  UpdateProvider,
  DeleteProvider,
  GetProviderPrices,
  SaveProviderPrice,
  DeleteProviderPrice,
} from "../../wailsjs/go/main/App";
import { domain } from "../../wailsjs/go/models";

export const PROVIDER_KEYS = {
  all: ["providers"] as const,
};

export const PROVIDER_PRICE_KEYS = {
  all: ["provider-prices"] as const,
  byProduct: (productId: number) => ["provider-prices", productId] as const,
};

export function useProviders() {
  return useQuery({
    queryKey: PROVIDER_KEYS.all,
    queryFn: async (): Promise<domain.Provider[]> => {
      const data = await GetProviders();
      return data || [];
    },
  });
}

export function useCreateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: domain.Provider) => CreateProvider(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_KEYS.all });
    },
  });
}

export function useUpdateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: domain.Provider) => UpdateProvider(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROVIDER_PRICE_KEYS.all });
    },
  });
}

export function useDeleteProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => DeleteProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_KEYS.all });
      // deleting a provider cascades its quotes
      queryClient.invalidateQueries({ queryKey: PROVIDER_PRICE_KEYS.all });
    },
  });
}

export function useProviderPrices(productId: number, enabled: boolean) {
  return useQuery({
    queryKey: PROVIDER_PRICE_KEYS.byProduct(productId),
    queryFn: async (): Promise<domain.ProviderPrice[]> => {
      const data = await GetProviderPrices(productId);
      return data || [];
    },
    enabled,
  });
}

export function useSaveProviderPrice(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pp: domain.ProviderPrice) => SaveProviderPrice(pp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_PRICE_KEYS.byProduct(productId) });
    },
  });
}

export function useDeleteProviderPrice(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => DeleteProviderPrice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_PRICE_KEYS.byProduct(productId) });
    },
  });
}
