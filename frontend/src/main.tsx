import React from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App";
import "@/i18n/config";
import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";

const queryClient = new QueryClient({
  // Global error surface: every failed mutation shows a toast, no per-mutation onError needed
  mutationCache: new MutationCache({
    onError: (error) => toast.error(String(error)),
  }),
});

const container = document.getElementById("root");

const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  </React.StrictMode>
);
