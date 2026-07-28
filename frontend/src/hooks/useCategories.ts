import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetCategories, CreateCategory, UpdateCategory, DeleteCategory } from "../../wailsjs/go/main/App";
import { domain } from "../../wailsjs/go/models";

export const CATEGORY_KEYS = {
  all: ["categories"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: CATEGORY_KEYS.all,
    queryFn: async (): Promise<domain.Category[]> => {
      const data = await GetCategories();
      return data || [];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: domain.Category) => CreateCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: domain.Category) => UpdateCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => DeleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
    },
  });
}
