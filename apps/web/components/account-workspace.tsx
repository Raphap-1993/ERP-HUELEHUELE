"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { RoleCode, type AuthSessionSummary, type LoyaltyAccountSummary } from "@huelegood/shared";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, StatusBadge } from "@huelegood/ui";
import { clearStoredSessionToken, readStoredSessionToken, writeStoredSessionToken } from "../lib/session";
import { fetchLoyaltySummary, fetchSession, login, logout, register } from "../lib/api";
import { PublicChecklist, PublicField, PublicPanel, PublicSectionHeading } from "./public-shell";

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

function AccountDetail({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-[#d8f3dc] bg-[#f7f8f4] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">{label}</p>
      <p className="mt-3 text-xl font-semibold text-[#1a3a2e]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-black/56">{helper}</p>
    </div>
  );
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
        const token = readStoredSessionToken();
        const response = await fetchLoyaltySummary(token ?? undefined);
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

  const hasSellerPanelAccess = useMemo(() => {
    if (!session) {
      return false;
    }

    const roles = session.user.roles.map((role) => role.code);
    return roles.includes(RoleCode.Vendedor) || roles.includes(RoleCode.SellerManager);
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
      setLoyaltySummary(null);
    }
  }

  if (loadingSession) {
    return (
      <div className="py-10">
        <PublicPanel className="mx-auto max-w-2xl text-center">
          <p className="text-sm text-black/58">Verificando tu sesión...</p>
        </PublicPanel>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-10 py-6 md:space-y-12 md:py-8">
        <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <PublicPanel className="space-y-8 bg-[#faf8f3] p-8">
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-black/42">Mi cuenta</p>
              <h1 className="max-w-3xl text-[2.8rem] font-semibold leading-[0.96] tracking-[-0.04em] text-[#1a3a2e] md:text-[4rem]">
                Acceso simple para compras, puntos y seguimiento.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-black/60">
                Ingresa con tu cuenta para consultar compras, beneficios y estado de tu experiencia Huelegood desde un mismo lugar.
              </p>
            </div>

            <PublicChecklist
              items={[
                "Login y registro claros, sin pasos innecesarios.",
                "Seguimiento de beneficios desde una sola vista.",
                "Acceso a panel comercial solo cuando tu perfil lo requiere."
              ]}
            />

            <div className="grid gap-3 md:grid-cols-3">
              <AccountDetail label="Cuenta" value="Privada" helper="Tu correo y datos quedan ligados a tu historial de compra." />
              <AccountDetail label="Puntos" value="Activos" helper="Se reflejan cuando la compra queda confirmada." />
              <AccountDetail label="Soporte" value="Directo" helper="Puedes seguir tu compra y resolver dudas desde tu cuenta." />
            </div>
          </PublicPanel>

          <Card id="acceso" className="rounded-[2rem] border-[#d8f3dc] bg-white shadow-[0_18px_54px_rgba(22,34,20,0.06)]">
            <CardHeader className="space-y-3">
              <CardTitle className="text-[1.85rem] tracking-[-0.03em]">Entrar o crear cuenta</CardTitle>
              <CardDescription>Accede con tu correo o crea una cuenta para revisar compras y beneficios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="inline-flex rounded-full border border-[#d8f3dc] bg-[#f7f8f4] p-1">
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm transition ${mode === "login" ? "bg-[#1a3a2e] text-white" : "text-[#1a3a2e]"}`}
                  onClick={() => setMode("login")}
                >
                  Ingresar
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm transition ${mode === "register" ? "bg-[#1a3a2e] text-white" : "text-[#1a3a2e]"}`}
                  onClick={() => setMode("register")}
                >
                  Crear cuenta
                </button>
              </div>

              {error ? <div className="rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

              {mode === "login" ? (
                <form className="space-y-4" onSubmit={handleLogin}>
                  <PublicField label="Correo electrónico">
                    <Input
                      type="email"
                      value={loginForm.email}
                      onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="correo@huelegood.com"
                    />
                  </PublicField>
                  <PublicField label="Contraseña">
                    <Input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Contraseña"
                    />
                  </PublicField>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Validando..." : "Ingresar"}
                  </Button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleRegister}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <PublicField label="Nombre y apellido" className="md:col-span-2">
                      <Input
                        value={registerForm.name}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value, accountType: "customer" }))}
                        placeholder="Nombre y apellido"
                      />
                    </PublicField>
                    <PublicField label="Correo electrónico">
                      <Input
                        type="email"
                        value={registerForm.email}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                        placeholder="correo@huelegood.com"
                      />
                    </PublicField>
                    <PublicField label="Contraseña">
                      <Input
                        type="password"
                        value={registerForm.password}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value, accountType: "customer" }))}
                        placeholder="Contraseña"
                      />
                    </PublicField>
                    <PublicField label="Teléfono" helper="Opcional">
                      <Input
                        value={registerForm.phone}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value, accountType: "customer" }))}
                        placeholder="Teléfono"
                      />
                    </PublicField>
                  </div>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Creando..." : "Crear cuenta"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6 md:space-y-10 md:py-8">
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[2rem] border-[#d8f3dc] bg-white shadow-[0_18px_54px_rgba(22,34,20,0.06)]">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Sesión activa</p>
              <CardTitle className="text-[2rem] tracking-[-0.03em]">{session.user.name}</CardTitle>
              <CardDescription>{session.user.email}</CardDescription>
            </div>
            <Button type="button" variant="secondary" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <AccountDetail
                label="Cuenta"
                value={session.user.accountType === "customer" ? "Cliente" : "Registrada"}
                helper="Tu perfil está listo para compras, seguimiento y beneficios."
              />
              <AccountDetail label="Estado" value="Activa" helper="Tu sesión está lista para operar en el sitio." />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[1.35rem] border border-[#d8f3dc] bg-[#f7f8f4] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Nombre</p>
                <p className="mt-3 text-lg font-semibold text-[#1a3a2e]">
                  {accountState?.firstName ?? "-"} {accountState?.lastName ?? ""}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-[#d8f3dc] bg-[#f7f8f4] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Correo</p>
                <p className="mt-3 text-lg font-semibold text-[#1a3a2e]">{session.user.email}</p>
              </div>
            </div>

            {session.user.vendorCode ? (
              <div className="rounded-[1.35rem] border border-[#d8f3dc] bg-[#f7f8f4] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Código vendedor</p>
                <p className="mt-3 text-lg font-semibold text-[#1a3a2e]">{session.user.vendorCode}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-[#d8f3dc] bg-[#faf8f3] shadow-[0_18px_54px_rgba(22,34,20,0.05)]">
          <CardHeader>
            <CardTitle className="text-[2rem] tracking-[-0.03em]">Puntos y beneficios</CardTitle>
            <CardDescription>Consulta aquí el estado actual de tus puntos y redenciones.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loadingLoyalty ? (
              <p className="text-sm text-black/58">Cargando puntos...</p>
            ) : loyaltySummary ? (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <AccountDetail label="Disponibles" value={String(loyaltySummary.availablePoints)} helper="Listos para usarse." />
                  <AccountDetail label="Pendientes" value={String(loyaltySummary.pendingPoints)} helper="Se consolidan cuando la compra se confirma." />
                  <AccountDetail label="Canjeados" value={String(loyaltySummary.redeemedPoints)} helper="Historial total aplicado." />
                </div>
                <div className="rounded-[1.35rem] border border-[#d8f3dc] bg-white px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Estado actual</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge tone="info" label={loyaltyMovementLabel(loyaltySummary.recentMovement)} />
                    <StatusBadge tone="warning" label={redemptionLabel(loyaltySummary.redemptionStatus)} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-black/58">
                    Tus puntos se reflejan y cambian de estado conforme se confirman tus compras y redenciones.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-black/58">Todavía no encontramos información de fidelización asociada a tu cuenta.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <PublicPanel className="space-y-4">
          <PublicSectionHeading
            eyebrow="Beneficios"
            title="Tu cuenta concentra lo importante."
            description="Compras, beneficios y soporte se mantienen dentro de una sola vista para que la experiencia se sienta clara y terminada."
          />
          <PublicChecklist
            items={[
              "Seguimiento de compra y estado de beneficios desde el mismo acceso.",
              "Cuenta lista para futuras recompensas y atención comercial.",
              "Experiencia consistente entre compra directa y panel comercial."
            ]}
          />
        </PublicPanel>

        {hasSellerPanelAccess ? (
          <PublicPanel className="space-y-4 bg-[#1a3a2e] text-white">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/44">Acceso comercial</p>
              <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-white">Tu cuenta también tiene panel vendedor.</h2>
              <p className="max-w-2xl text-sm leading-7 text-white/70">
                Desde ahí puedes revisar pedidos atribuidos, comisiones y liquidaciones sin salir del ecosistema de la marca.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/panel-vendedor" variant="secondary">
                Ir al panel vendedor
              </Button>
              <Button href="/checkout" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                Ver checkout
              </Button>
            </div>
          </PublicPanel>
        ) : (
          <PublicPanel className="space-y-4 bg-[#faf8f3]">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Siguiente paso</p>
              <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[#1a3a2e]">Tu cuenta ya está lista para seguir comprando.</h2>
              <p className="max-w-2xl text-sm leading-7 text-black/58">
                Puedes volver al catálogo, avanzar al checkout o seguir explorando la experiencia Huelegood con una sesión ya activa.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/catalogo">Ver catálogo</Button>
              <Button href="/checkout" variant="secondary">
                Ir al checkout
              </Button>
            </div>
          </PublicPanel>
        )}
      </section>
    </div>
  );
}
