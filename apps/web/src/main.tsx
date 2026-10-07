import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import { i18n } from "./i18n";
import { App } from "./App";
import { createSupabaseSetup } from "./lib/supabase";
import { AppProviders, createQueryClient } from "./providers/AppProviders";
import { AppearanceProvider } from "./providers/AppearanceProvider";
import { SetupPage } from "./pages/SetupPage";
import "./index.css";

const container = document.getElementById("root");
if (!container) throw new Error("Không tìm thấy phần tử #root");

const setup = createSupabaseSetup({
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

createRoot(container).render(
  <StrictMode>
    {setup.ok ? (
      <AppProviders client={setup.client} queryClient={createQueryClient()}>
        <App />
      </AppProviders>
    ) : (
      <I18nextProvider i18n={i18n}>
        <AppearanceProvider>
          <SetupPage message={setup.message} />
        </AppearanceProvider>
      </I18nextProvider>
    )}
  </StrictMode>,
);
