import "../global.css";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nextProvider } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ThemePreference } from "@important-dates/core";
import { BeVietnamPro_400Regular } from "@expo-google-fonts/be-vietnam-pro/400Regular";
import { BeVietnamPro_500Medium } from "@expo-google-fonts/be-vietnam-pro/500Medium";
import { BeVietnamPro_600SemiBold } from "@expo-google-fonts/be-vietnam-pro/600SemiBold";
import { BeVietnamPro_700Bold } from "@expo-google-fonts/be-vietnam-pro/700Bold";
import { BricolageGrotesque_600SemiBold } from "@expo-google-fonts/bricolage-grotesque/600SemiBold";
import { BricolageGrotesque_700Bold } from "@expo-google-fonts/bricolage-grotesque/700Bold";
import { LoadingState } from "../src/components/StateViews";
import { i18n, loadStoredPreferences } from "../src/i18n";
import { createSupabaseSetup } from "../src/lib/supabase";
import { AppearanceProvider, useAppearance } from "../src/providers/AppearanceProvider";
import { AuthProvider, useAuth } from "../src/providers/AuthProvider";
import { SupabaseProvider } from "../src/providers/SupabaseProvider";
import { ToastProvider } from "../src/providers/ToastProvider";
import { SetupScreen } from "../src/screens/SetupScreen";

// Phải truy cập đúng dạng process.env.EXPO_PUBLIC_* để Expo thay giá trị lúc build
const setup = createSupabaseSetup({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

// Không thử lại tự động khi lỗi: người dùng bấm "Thử lại" để thấy lỗi ngay
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

function RootStack() {
  const auth = useAuth();
  const { resolvedTheme, colors } = useAppearance();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
      {auth.status === "loading" ? (
        <View className="flex-1 items-center justify-center">
          <LoadingState />
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={auth.status === "signedIn"}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          <Stack.Protected guard={auth.status === "signedOut"}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
  });
  const [initialTheme, setInitialTheme] = useState<ThemePreference | null>(null);

  useEffect(() => {
    void loadStoredPreferences().then((stored) => setInitialTheme(stored.theme));
  }, []);

  // Chờ font và lựa chọn đã lưu để mở app không bị nháy sai font/theme (lỗi font thì vẫn chạy bằng font hệ thống)
  if ((!fontsLoaded && !fontError) || initialTheme === null) return null;

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <AppearanceProvider initialTheme={initialTheme}>
          {setup.ok ? (
            <QueryClientProvider client={queryClient}>
              <SupabaseProvider client={setup.client}>
                <AuthProvider>
                  <ToastProvider>
                    <RootStack />
                  </ToastProvider>
                </AuthProvider>
              </SupabaseProvider>
            </QueryClientProvider>
          ) : (
            <SetupScreen message={setup.message} />
          )}
        </AppearanceProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
