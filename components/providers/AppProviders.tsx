"use client";

import React, { useState, useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useThemeStore } from "@/store/themeStore";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const applyCssVariables = useThemeStore((state) => state.applyCssVariables);

  useEffect(() => {
    applyCssVariables();
  }, [applyCssVariables]);

  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#0a0a0a",
              color: "#ffffff",
              border: "1px solid #262626",
              borderRadius: "10px",
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}

