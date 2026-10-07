import { createContext, useContext, type ReactNode } from "react";
import type { AppSupabaseClient } from "@important-dates/core";

const SupabaseContext = createContext<AppSupabaseClient | null>(null);

export function SupabaseProvider({
  client,
  children,
}: {
  client: AppSupabaseClient;
  children: ReactNode;
}) {
  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

export function useSupabase(): AppSupabaseClient {
  const client = useContext(SupabaseContext);
  if (!client) throw new Error("useSupabase phải nằm trong SupabaseProvider");
  return client;
}
