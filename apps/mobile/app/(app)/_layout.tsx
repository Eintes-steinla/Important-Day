import { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { detectTimeZone } from "@important-dates/core";
import { useProfileQuery, useUpdateProfile } from "../../src/hooks/queries";
import { useAppearance } from "../../src/providers/AppearanceProvider";
import { useSignedInUser } from "../../src/providers/AuthProvider";

/** Khi đăng nhập, áp theme/ngôn ngữ đã lưu ở profile và ghi múi giờ thiết bị nếu profile còn mặc định (UTC). */
function ProfileSync() {
  const user = useSignedInUser();
  const profile = useProfileQuery(user.id);
  const update = useUpdateProfile(user.id);
  const { setTheme, setLanguage } = useAppearance();
  const syncedFor = useRef<string | null>(null);

  const data = profile.data;
  const { mutate } = update;
  useEffect(() => {
    if (!data || syncedFor.current === data.id) return;
    syncedFor.current = data.id;
    setTheme(data.theme);
    setLanguage(data.language);
    const timezone = detectTimeZone();
    if (data.timezone === "UTC" && timezone !== "UTC") mutate({ timezone });
  }, [data, setTheme, setLanguage, mutate]);

  return null;
}

export default function AppLayout() {
  return (
    <>
      <ProfileSync />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="event-form" options={{ presentation: "modal" }} />
        <Stack.Screen name="category-form" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
