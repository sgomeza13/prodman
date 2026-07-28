import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetSettings, SaveSettings } from "../../wailsjs/go/main/App";

export const SETTINGS_KEYS = {
  all: ["settings"] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEYS.all,
    queryFn: async (): Promise<Record<string, string>> => {
      const data = await GetSettings();
      return data || {};
    },
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Record<string, string>) => SaveSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.all });
    },
  });
}
