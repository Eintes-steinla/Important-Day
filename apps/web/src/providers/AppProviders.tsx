import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppSupabaseClient } from "@important-dates/core";
import { i18n } from "../i18n";
import { AppearanceProvider } from "./AppearanceProvider";
import { AuthProvider } from "./AuthProvider";
import { SupabaseProvider } from "./SupabaseProvider";
import { ToastProvider } from "./ToastProvider";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Không thử lại tự động khi lỗi: người dùng bấm "Thử lại" để thấy lỗi ngay
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });
}

/** Thứ tự: i18n, dữ liệu, giao diện, thông báo, Supabase, phiên đăng nhập. Dùng chung cho app và test. */
export function AppProviders({
  client,
  queryClient,
  children,
}: {
  client: AppSupabaseClient;
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AppearanceProvider>
          <ToastProvider>
            <SupabaseProvider client={client}>
              <AuthProvider>{children}</AuthProvider>
            </SupabaseProvider>
          </ToastProvider>
        </AppearanceProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
