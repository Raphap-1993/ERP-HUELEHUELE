"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { RoleCode, type AuthCredentialsInput, type AuthSessionSummary } from "@huelegood/shared";
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

const localAdminBypassEnabled = process.env.NEXT_PUBLIC_LOCAL_ADMIN_BYPASS === "true";

const localBypassSession: AuthSessionSummary = {
  token: "local-admin-bypass",
  expiresAt: "2099-12-31T23:59:59.000Z",
  user: {
    id: "local-admin-bypass",
    name: "Admin Local",
    email: "admin@huelegood.local",
    roles: [
      { code: RoleCode.SuperAdmin, label: "Super Admin" },
      { code: RoleCode.Admin, label: "Admin" }
    ],
    accountType: "admin"
  }
};

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSessionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    if (localAdminBypassEnabled) {
      setSession(localBypassSession);
      return localBypassSession;
    }

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
    if (localAdminBypassEnabled) {
      writeStoredAdminSessionToken(localBypassSession.token);
      setSession(localBypassSession);
      return localBypassSession;
    }

    const response = await loginAdmin(credentials);
    if (!response.data) {
      throw new Error("No pudimos iniciar sesión.");
    }

    writeStoredAdminSessionToken(response.data.token);
    setSession(response.data);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    if (localAdminBypassEnabled) {
      clearStoredAdminSessionToken();
      setSession(localBypassSession);
      return;
    }

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
