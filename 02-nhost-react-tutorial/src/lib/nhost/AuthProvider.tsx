import { createClient } from "@nhost/nhost-js";
import type { StoredSession } from "@nhost/nhost-js/session";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AuthContext, type AuthContextType } from "./useAuth";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // nhost must be created before useState so it can be used in lazy initializers
  const nhost = useMemo(
    () =>
      createClient({
        region: import.meta.env.VITE_NHOST_REGION || "local",
        subdomain: import.meta.env.VITE_NHOST_SUBDOMAIN || "local",
      }),
    [],
  );

  // Lazy initializer reads session synchronously on mount, so effects never need
  // to call setState in their synchronous body (only in callbacks).
  const [session, setSession] = useState<StoredSession | null>(() =>
    nhost.getUserSession(),
  );
  const lastRefreshTokenIdRef = useRef<string | null>(
    nhost.getUserSession()?.refreshTokenId ?? null,
  );

  const user = session?.user ?? null;
  const isAuthenticated = !!session;

  const reloadSession = useCallback(
    (currentRefreshTokenId: string | null) => {
      if (currentRefreshTokenId !== lastRefreshTokenIdRef.current) {
        lastRefreshTokenIdRef.current = currentRefreshTokenId;
        setSession(nhost.getUserSession());
      }
    },
    [nhost],
  );

  // Subscribe to cross-tab session changes — setState only inside the callback
  useEffect(() => {
    const unsubscribe = nhost.sessionStorage.onChange((updatedSession) => {
      reloadSession(updatedSession?.refreshTokenId ?? null);
    });
    return unsubscribe;
  }, [nhost, reloadSession]);

  // Re-check session when the page regains focus or visibility
  useEffect(() => {
    const checkSessionOnFocus = () => {
      reloadSession(nhost.getUserSession()?.refreshTokenId ?? null);
    };

    // Named reference required so removeEventListener matches addEventListener
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSessionOnFocus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", checkSessionOnFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", checkSessionOnFocus);
    };
  }, [nhost, reloadSession]);

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated,
    isLoading: false,
    nhost,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};