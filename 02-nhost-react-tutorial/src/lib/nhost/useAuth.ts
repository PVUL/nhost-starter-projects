import type { NhostClient } from "@nhost/nhost-js";
import type { StoredSession } from "@nhost/nhost-js/session";
import { createContext, useContext } from "react";

export interface AuthContextType {
  user: StoredSession["user"] | null;
  session: StoredSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  nhost: NhostClient;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
