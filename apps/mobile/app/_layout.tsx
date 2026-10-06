import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nextProvider } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { i18n } from "../src/i18n";
import { ThemeProvider, useTheme } from "../src/theme/ThemeProvider";

const queryClient = new QueryClient();

function ThemedStack() {
  const { resolved } = useTheme();
  return (
    <>
      <StatusBar style={resolved === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <ThemedStack />
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
