import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "./SupabaseProvider";

export type AuthState =
  | { status: "loading"; user: null }
  | { status: "signedOut"; user: null }
  | { status: "signedIn"; user: User };

const AuthContext = createContext<AuthState | null>(null);

/** Theo dõi phiên đăng nhập. Khi đăng xuất thì xóa cache dữ liệu để không lộ dữ liệu sang tài khoản khác. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useSupabase();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  useEffect(() => {
    let active = true;
    const apply = (user: User | null) => {
      if (!active) return;
      setState(user ? { status: "signedIn", user } : { status: "signedOut", user: null });
    };

    void client.auth
      .getSession()
      .then(({ data }) => apply(data.session?.user ?? null))
      .catch(() => apply(null));

    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") queryClient.clear();
      apply(session?.user ?? null);
    });

    // Trên mobile chỉ tự làm mới token khi app đang mở (khuyến nghị của Supabase)
    void client.auth.startAutoRefresh();
    const appState = AppState.addEventListener("change", (next) => {
      if (next === "active") void client.auth.startAutoRefresh();
      else void client.auth.stopAutoRefresh();
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
      appState.remove();
      void client.auth.stopAutoRefresh();
    };
  }, [client, queryClient]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth phải nằm trong AuthProvider");
  return value;
}

/** Dùng trong vùng đã đăng nhập. */
export function useSignedInUser(): User {
  const auth = useAuth();
  if (auth.status !== "signedIn") throw new Error("Cần đăng nhập");
  return auth.user;
}
