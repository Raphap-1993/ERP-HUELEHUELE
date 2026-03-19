"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { type AuthSessionSummary, type LoyaltyAccountSummary } from "@huelegood/shared";
import {
  Button,
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
import { fetchLoyaltySummary, fetchSession, login, logout, register } from "../lib/api";

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ")
  };
}

function loyaltyMovementLabel(status: LoyaltyAccountSummary["recentMovement"]) {
  const labels: Record<LoyaltyAccountSummary["recentMovement"], string> = {
    pending: "Pendiente",
    available: "Disponible",
    reversed: "Revertido",
    expired: "Expirado"
  };

  return labels[status];
}

function redemptionLabel(status: LoyaltyAccountSummary["redemptionStatus"]) {
  const labels: Record<LoyaltyAccountSummary["redemptionStatus"], string> = {
    pending: "Pendiente",
    applied: "Aplicado",
    cancelled: "Cancelado"
  };

  return labels[status];
}

export function AccountWorkspace() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [session, setSession] = useState<AuthSessionSummary | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingLoyalty, setLoadingLoyalty] = useState(true);
  const [loyaltySummary, setLoyaltySummary] = useState<LoyaltyAccountSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
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

  useEffect(() => {
    let active = true;

    async function loadLoyalty() {
      if (!session) {
        if (active) {
          setLoyaltySummary(null);
          setLoadingLoyalty(false);
        }
        return;
      }

      setLoadingLoyalty(true);

      try {
        const response = await fetchLoyaltySummary();
        if (!active) {
          return;
        }

        setLoyaltySummary(response.data ?? null);
      } catch {
        if (active) {
          setLoyaltySummary(null);
        }
      } finally {
        if (active) {
          setLoadingLoyalty(false);
        }
      }
    }

    void loadLoyalty();

    return () => {
      active = false;
    };
  }, [session]);

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
      <SectionHeader title="Mi cuenta" description="Accede a tus datos, revisa tu compra y consulta tus puntos cuando tengas sesión activa." />

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Acceso</CardTitle>
            <CardDescription>Inicia sesión o crea tu cuenta para gestionar tu experiencia de compra.</CardDescription>
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
            <CardDescription>Consulta los datos principales de tu cuenta cuando hayas iniciado sesión.</CardDescription>
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

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-black/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/40">Cuenta</p>
                    <p className="mt-2 text-sm font-semibold text-[#132016]">{session.user.accountType === "customer" ? "Cliente" : "Cuenta registrada"}</p>
                  </div>
                  <div className="rounded-2xl bg-black/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/40">Estado</p>
                    <p className="mt-2 text-sm font-semibold text-[#132016]">Sesión activa</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm text-black/65">
                  <p>
                    <strong>Nombre:</strong> {accountState?.firstName ?? "-"} {accountState?.lastName ?? ""}
                  </p>
                  <p>
                    <strong>Correo:</strong> {session.user.email}
                  </p>
                </div>

                <Button type="button" variant="secondary" onClick={handleLogout}>
                  Cerrar sesión
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-black/60">Aún no has iniciado sesión. Entra con tu cuenta o crea una para ver tus pedidos y beneficios.</p>
                <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4 text-sm text-black/65">
                  Tu cuenta te permitirá guardar tus datos, revisar tu compra y consultar tus puntos cuando estén disponibles.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fidelización</CardTitle>
          <CardDescription>Consulta tus puntos disponibles, pendientes y canjes desde tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          {!session ? (
            <p className="text-sm text-black/55">Inicia sesión para consultar tu saldo de puntos y tus movimientos.</p>
          ) : loadingLoyalty ? (
            <p className="text-sm text-black/55">Cargando puntos...</p>
          ) : loyaltySummary ? (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-black/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-black/40">Disponibles</p>
                <p className="mt-2 text-3xl font-semibold text-[#132016]">{loyaltySummary.availablePoints}</p>
              </div>
              <div className="rounded-2xl bg-black/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-black/40">Pendientes</p>
                <p className="mt-2 text-3xl font-semibold text-[#132016]">{loyaltySummary.pendingPoints}</p>
              </div>
              <div className="rounded-2xl bg-black/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-black/40">Canjeados</p>
                <p className="mt-2 text-3xl font-semibold text-[#132016]">{loyaltySummary.redeemedPoints}</p>
              </div>
              <div className="rounded-2xl bg-[#132016] p-4 text-white">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">Estado</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge tone="info" label={loyaltyMovementLabel(loyaltySummary.recentMovement)} />
                  <StatusBadge tone="warning" label={redemptionLabel(loyaltySummary.redemptionStatus)} />
                </div>
                <p className="mt-3 text-sm leading-6 text-white/75">
                  Tus puntos se irán reflejando conforme se confirmen tus compras y redenciones.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-black/55">No encontramos una cuenta de loyalty para mostrar.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
