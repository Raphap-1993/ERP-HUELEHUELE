"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthCredentialsInput, AuthSessionSummary } from "@huelegood/shared";
import { fetchAdminSession, loginAdmin, logoutAdmin } from "../lib/api";
import {
  clearStoredAdminSessionToken,
  readStoredAdminSessionToken,
  writeStoredAdminSessionToken
} from "../lib/session";

type AdminSessionContextValue = {
  session: AuthSessionSummary | null;
  loading: boolean;
  login: (credentials: AuthCredentialsInput) => Promise<AuthSessionSummary>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthSessionSummary | null>;
};

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSessionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const token = readStoredAdminSessionToken();
    if (!token) {
      setSession(null);
      return null;
    }

    try {
      const response = await fetchAdminSession(token);
      const nextSession = response.data ?? null;
      setSession(nextSession);
      return nextSession;
    } catch {
      clearStoredAdminSessionToken();
      setSession(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      await refreshSession();
      if (active) {
        setLoading(false);
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [refreshSession]);

  const login = useCallback(async (credentials: AuthCredentialsInput) => {
    const response = await loginAdmin(credentials);
    if (!response.data) {
      throw new Error("No pudimos iniciar sesión.");
    }

    writeStoredAdminSessionToken(response.data.token);
    setSession(response.data);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    const token = readStoredAdminSessionToken();
    try {
      await logoutAdmin(token ?? undefined);
    } finally {
      clearStoredAdminSessionToken();
      setSession(null);
    }
  }, []);

  const value = useMemo<AdminSessionContextValue>(
    () => ({
      session,
      loading,
      login,
      logout,
      refreshSession
    }),
    [loading, login, logout, refreshSession, session]
  );

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (!context) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }

  return context;
}
