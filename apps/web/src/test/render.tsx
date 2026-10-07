import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { i18n } from "../i18n";
import { AppearanceProvider } from "../providers/AppearanceProvider";
import { ToastProvider } from "../providers/ToastProvider";

/** Render kèm i18n (tiếng Việt), theme, toast và React Query, chưa gắn Supabase. */
export function renderWithProviders(ui: ReactElement) {
  void i18n.changeLanguage("vi");
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AppearanceProvider>
          <ToastProvider>{ui}</ToastProvider>
        </AppearanceProvider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}
