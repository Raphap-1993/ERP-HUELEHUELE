"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { type AuthSessionSummary } from "@huelegood/shared";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  SectionHeader,
  StatusBadge,
  Separator
} from "@huelegood/ui";
import { clearStoredSessionToken, readStoredSessionToken, writeStoredSessionToken } from "../lib/session";
import { fetchSession, login, logout, register } from "../lib/api";

const demoAccounts = [
  { email: "cliente@huelegood.com", password: "huelegood123", label: "Cliente demo" },
  { email: "seller@huelegood.com", password: "huelegood123", label: "Seller demo" },
  { email: "admin@huelegood.com", password: "huelegood123", label: "Admin demo" }
];

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ")
  };
}

export function AccountWorkspace() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [session, setSession] = useState<AuthSessionSummary | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ email: "cliente@huelegood.com", password: "huelegood123" });
  const [registerForm, setRegisterForm] = useState({
    name: "Nuevo Cliente",
    email: "",
    password: "",
    accountType: "customer" as "customer" | "seller",
    phone: ""
  });

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const token = readStoredSessionToken();
      if (!token) {
        if (active) {
          setLoadingSession(false);
        }
        return;
      }

      try {
        const response = await fetchSession(token);
        if (!active) {
          return;
        }

        if (response.data) {
          setSession(response.data);
        } else {
          clearStoredSessionToken();
        }
      } catch {
        clearStoredSessionToken();
      } finally {
        if (active) {
          setLoadingSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  const accountState = useMemo(() => {
    if (!session) {
      return null;
    }

    return splitName(session.user.name);
  }, [session]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await login(loginForm);
      if (response.data) {
        setSession(response.data);
        writeStoredSessionToken(response.data.token);
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No pudimos iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await register(registerForm);
      if (response.data) {
        setSession(response.data);
        writeStoredSessionToken(response.data.token);
      }
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "No pudimos crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    const token = readStoredSessionToken();
    try {
      await logout(token ?? undefined);
    } finally {
      clearStoredSessionToken();
      setSession(null);
    }
  }

  return (
    <div className="space-y-8 py-6 md:py-10">
      <SectionHeader
        title="Mi cuenta"
        description="Acceso de cliente, seller o admin demo para validar el flujo de autenticación."
      />

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Acceso</CardTitle>
            <CardDescription>Login y registro inicial para el bloque de auth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant={mode === "login" ? "primary" : "secondary"} onClick={() => setMode("login")}>
                Entrar
              </Button>
              <Button type="button" variant={mode === "register" ? "primary" : "secondary"} onClick={() => setMode("register")}>
                Crear cuenta
              </Button>
            </div>

            {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            {mode === "login" ? (
              <form className="space-y-4" onSubmit={handleLogin}>
                <Input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="correo@huelegood.com"
                />
                <Input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Contraseña"
                />
                <Button type="submit" disabled={submitting || loadingSession}>
                  {submitting ? "Validando..." : "Ingresar"}
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleRegister}>
                <Input
                  value={registerForm.name}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Nombre y apellido"
                />
                <Input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="correo@huelegood.com"
                />
                <Input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Contraseña"
                />
                <select
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none"
                  value={registerForm.accountType}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      accountType: event.target.value as "customer" | "seller"
                    }))
                  }
                >
                  <option value="customer">Cliente</option>
                  <option value="seller">Vendedor</option>
                </select>
                <Input
                  value={registerForm.phone}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Teléfono"
                />
                <Button type="submit" disabled={submitting || loadingSession}>
                  {submitting ? "Creando..." : "Crear cuenta"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sesión activa</CardTitle>
            <CardDescription>El API devuelve un token demo y roles listos para la UI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingSession ? (
              <p className="text-sm text-black/55">Cargando sesión...</p>
            ) : session ? (
              <div className="space-y-4">
                <div className="rounded-3xl bg-[#132016] px-5 py-4 text-white">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Usuario</p>
                  <h3 className="mt-2 text-2xl font-semibold">{session.user.name}</h3>
                  <p className="text-sm text-white/70">{session.user.email}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {session.user.roles.map((role) => (
                    <Badge key={role.code} tone="info">
                      {role.label}
                    </Badge>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-black/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/40">Tipo</p>
                    <p className="mt-2 text-sm font-semibold text-[#132016]">{session.user.accountType}</p>
                  </div>
                  <div className="rounded-2xl bg-black/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/40">Expira</p>
                    <p className="mt-2 text-sm font-semibold text-[#132016]">{session.expiresAt}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm text-black/65">
                  <p>
                    <strong>Nombre dividido:</strong> {accountState?.firstName ?? "-"} {accountState?.lastName ?? ""}
                  </p>
                  <p>
                    <strong>Token:</strong> {session.token.slice(0, 12)}...
                  </p>
                </div>

                <Button type="button" variant="secondary" onClick={handleLogout}>
                  Cerrar sesión
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-black/60">No hay sesión activa. Puedes entrar con uno de estos accesos demo.</p>
                <div className="space-y-3">
                  {demoAccounts.map((account) => (
                    <div key={account.email} className="rounded-2xl border border-black/10 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#132016]">{account.label}</p>
                          <p className="text-sm text-black/55">{account.email}</p>
                        </div>
                        <StatusBadge tone="info" label="Demo" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
