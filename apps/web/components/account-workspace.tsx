"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AuthSessionSummary, LoyaltyAccountSummary } from "@huelegood/shared";
import { fetchLoyaltySummary, fetchSession, login, logout } from "../lib/api";
import { clearStoredSessionToken, readStoredSessionToken, writeStoredSessionToken } from "../lib/session";
import {
  accountTypeLabel,
  hasBaseAccountAccess,
  resolveCommercialPortalHref
} from "../lib/portal-access";
import {
  HueleBadge,
  HueleButton,
  HueleButtonLink,
  HueleFieldShell,
  HuelePanel,
  HuelePublicPage,
  HueleSection,
  HueleStatusCard
} from "./huele-public-ui";

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

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function AccessFlag({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "green" | "amber" | "neutral";
}) {
  const toneClass =
    tone === "green"
      ? "bg-[#eef6e8] text-[#61a740]"
      : tone === "amber"
        ? "bg-[#fff5df] text-[#8b6118]"
        : "bg-[#f4f4f0] text-[#6b7280]";

  return (
    <div className="rounded-[14px] border border-[rgba(26,58,46,0.08)] bg-white px-4 py-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7280]">{label}</p>
      <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

export function AccountWorkspace() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSessionSummary | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingLoyalty, setLoadingLoyalty] = useState(true);
  const [loyaltySummary, setLoyaltySummary] = useState<LoyaltyAccountSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

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

  const commercialPortalHref = useMemo(() => resolveCommercialPortalHref(session), [session]);
  const accountAccessEnabled = hasBaseAccountAccess(session);

  useEffect(() => {
    if (commercialPortalHref) {
      router.replace(commercialPortalHref);
    }
  }, [commercialPortalHref, router]);

  useEffect(() => {
    let active = true;

    async function loadLoyalty() {
      if (!session || !accountAccessEnabled) {
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
  }, [accountAccessEnabled, session]);

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
      <HuelePublicPage
        eyebrow="Cuenta y acceso"
        title="Verificando tu sesión"
        description="Estamos revisando tu acceso para llevarte a la cuenta o al portal comercial que corresponda."
      >
        <HueleSection>
          <HueleStatusCard title="Un momento" tone="dark">
            <p className="text-sm leading-7 text-white/78">Verificando tu sesion...</p>
          </HueleStatusCard>
        </HueleSection>
      </HuelePublicPage>
    );
  }

  if (!session) {
    return (
      <HuelePublicPage
        eyebrow="Cuenta y acceso"
        title="Acceso a cuenta y rutas comerciales"
        description="Inicia sesion para consultar tu cuenta o entrar automaticamente al portal vendedor o mayorista si ya tienes acceso."
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr] lg:items-start">
          <HuelePanel tone="dark" className="p-8 text-white sm:p-10">
            <HueleBadge tone="mint">Ingreso Huele</HueleBadge>
            <h2 className="mb-4 mt-5 text-[2.4rem] leading-[1.05] text-white">
              Una sola cuenta para comprar y operar.
            </h2>
            <p className="mb-8 text-sm leading-7 text-white/70">
              Usa tus credenciales de Huele Huele. Si tu perfil es vendedor o mayorista, te enviaremos directo a tu portal.
            </p>
            <div className="space-y-3">
              {[
                "Cuenta base para identidad y beneficios.",
                "Panel vendedor cuando tienes codigo activo.",
                "Portal mayorista o distribuidor bajo la misma sesion."
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-[13px] text-white/70">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#61a740] text-[10px] text-white">
                    ✓
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </HuelePanel>

          <HuelePanel tone="cream" className="p-8">
            <HueleBadge tone="sun">Ingreso</HueleBadge>
            <h2 className="mb-1.5 mt-5 text-[2rem] leading-tight text-[var(--hh-public-green-950)]">Ingresa a tu cuenta</h2>
            <p className="mb-6 text-sm leading-7 text-[var(--hh-public-muted)]">Accede con el correo y contraseña asignados por Huele Huele.</p>

            {error ? <div className="mb-5 rounded-[11px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            <form className="space-y-4" onSubmit={handleLogin}>
              <HueleFieldShell label="Correo electronico">
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="tu@correo.com"
                />
              </HueleFieldShell>
              <HueleFieldShell label="Contrasena">
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="••••••••"
                />
              </HueleFieldShell>
              <HueleButton type="submit" disabled={submitting} tone="dark" className="w-full">
                {submitting ? "Validando..." : "Ingresar"}
              </HueleButton>
            </form>

            <p className="mt-5 text-center text-[12px] leading-6 text-[#6b7280]">
              Si aún no tienes acceso comercial, solicita el alta al equipo correspondiente.
            </p>
          </HuelePanel>
        </div>
      </HuelePublicPage>
    );
  }

  if (commercialPortalHref) {
    return (
      <HuelePublicPage
        eyebrow="Gateway comercial"
        title="Tu sesión ya tiene un portal operativo asignado"
        description="Detectamos tu perfil comercial y te estamos llevando al espacio correcto."
      >
        <HueleSection>
        <HuelePanel tone="cream" className="space-y-5">
          <HueleBadge tone="green">{accountTypeLabel(session.user.accountType)}</HueleBadge>
          <h2 className="text-[2rem] leading-tight text-[var(--hh-public-green-950)]">Redirigiendo a tu portal</h2>
          <p className="text-sm leading-7 text-[#6b7280]">
            Tu cuenta ya identificó que esta sesión debe operar desde <span className="font-semibold text-[#1a3a2e]">{commercialPortalHref}</span>.
          </p>
          <div className="flex flex-wrap gap-3">
            <HueleButtonLink href={commercialPortalHref} tone="dark">Abrir portal ahora</HueleButtonLink>
            <HueleButton type="button" onClick={() => void handleLogout()} tone="secondary">
              Cerrar sesión
            </HueleButton>
          </div>
        </HuelePanel>
        </HueleSection>
      </HuelePublicPage>
    );
  }

  if (!accountAccessEnabled) {
    return (
      <HuelePublicPage
        eyebrow="Cuenta restringida"
        title="Tu sesión no tiene cuenta base habilitada"
        description="La autenticación es valida, pero esta cuenta no tiene acceso habilitado a la seccion de cuenta."
      >
        <HueleSection>
        <HuelePanel tone="cream" className="space-y-5">
          <HueleBadge tone="blue">Acceso no disponible</HueleBadge>
          <h2 className="text-[2rem] leading-tight text-[var(--hh-public-green-950)]">Tu sesion sigue activa</h2>
          <p className="text-sm leading-7 text-[#6b7280]">
            Sesión activa: <span className="font-semibold text-[#1a3a2e]">{session.user.name}</span> · {session.user.email}
          </p>
          <div className="flex flex-wrap gap-3">
            <HueleButtonLink href="/catalogo" tone="dark">Ir al catálogo</HueleButtonLink>
            <HueleButton type="button" onClick={() => void handleLogout()} tone="secondary">
              Cerrar sesión
            </HueleButton>
          </div>
        </HuelePanel>
        </HueleSection>
      </HuelePublicPage>
    );
  }

  return (
    <HuelePublicPage
      eyebrow="Cuenta base autenticada"
      title="Tu cuenta Huele Huele"
      description="Identidad, beneficios y accesos disponibles desde un espacio simple y seguro."
      actions={
        <>
          <HueleButtonLink href="/catalogo" tone="primary">Ir al catalogo</HueleButtonLink>
          <HueleButtonLink href="/mayoristas" tone="ghost">Canal mayorista</HueleButtonLink>
        </>
      }
    >
      <HueleSection>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
        <div className="space-y-4">
          <HuelePanel tone="cream" className="p-7 text-center">
            <div className="mx-auto mb-3.5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#eef6e8] font-serif text-[26px] font-black text-[#61a740]">
              {initials(session.user.name)}
            </div>
            <p className="font-serif text-[18px] font-bold text-[#1a3a2e]">{session.user.name}</p>
            <p className="mt-0.5 text-[13px] text-[#6b7280]">{session.user.email}</p>
            <HueleBadge tone="green" className="mt-3">Cuenta base activa</HueleBadge>
            <div className="mt-4 grid gap-2.5">
              <AccessFlag label="Código vendedor" value={session.user.vendorCode ?? "No asociado"} tone={session.user.vendorCode ? "green" : "neutral"} />
              <AccessFlag
                label="Lead mayorista"
                value={session.user.wholesaleLeadId ?? "No asociado"}
                tone={session.user.wholesaleLeadId ? "amber" : "neutral"}
              />
            </div>
          </HuelePanel>

          <HuelePanel tone="cream" className="p-4">
            <HueleButton
              type="button"
              tone="secondary"
              onClick={() => {
                void handleLogout();
              }}
              className="w-full"
            >
              Cerrar sesión
            </HueleButton>
          </HuelePanel>
        </div>

        <div className="space-y-5">
          <HuelePanel tone="cream" className="p-8">
            <HueleBadge tone="mint">{accountTypeLabel(session.user.accountType)}</HueleBadge>
            <h3 className="mb-1 mt-4 text-[2rem] leading-tight text-[#1a3a2e]">Identidad y accesos</h3>
            <p className="mb-6 text-sm leading-7 text-[#6b7280]">Resumen de tu sesion activa y de los permisos comerciales asociados.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[14px] bg-[#f4f4f0] px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7280]">Account type</p>
                <p className="mt-2 text-[15px] font-semibold text-[#1a3a2e]">{accountTypeLabel(session.user.accountType)}</p>
              </div>
              <div className="rounded-[14px] bg-[#f4f4f0] px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b7280]">Rol principal</p>
                <p className="mt-2 text-[15px] font-semibold text-[#1a3a2e]">{session.user.primaryRoleCode ?? "No definido"}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {session.user.roles.map((role) => (
                <span key={role.code} className="rounded-full bg-[#eef6e8] px-3 py-1 text-[11px] font-semibold text-[#61a740]">
                  {role.label}
                </span>
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <AccessFlag label="Cuenta" value="Habilitada" tone="green" />
              <AccessFlag label="Seller panel" value="No aplica en esta cuenta" tone="neutral" />
              <AccessFlag label="Wholesale portal" value="No aplica en esta cuenta" tone="neutral" />
            </div>
          </HuelePanel>

          <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
            <HuelePanel tone="cream" className="p-8">
              <HueleBadge tone="sun">Beneficios</HueleBadge>
              <h3 className="mb-1 mt-4 text-[2rem] leading-tight text-[#1a3a2e]">Puntos y beneficios</h3>
              <p className="mb-6 text-sm leading-7 text-[#6b7280]">Si tienes beneficios activos, aqui veras el saldo disponible y los movimientos recientes.</p>

              {loadingLoyalty ? (
                <div className="rounded-[14px] bg-[#f4f4f0] px-4 py-5 text-sm text-[#6b7280]">Cargando loyalty...</div>
              ) : loyaltySummary ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Disponibles", value: loyaltySummary.availablePoints, helper: "Listos para usar" },
                      { label: "Pendientes", value: loyaltySummary.pendingPoints, helper: "Se confirman pronto" },
                      { label: "Canjeados", value: loyaltySummary.redeemedPoints, helper: "Total histórico" }
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-[13px] border border-[#eef6e8] bg-[#f4f4f0] px-4 py-4">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">{stat.label}</p>
                        <p className="mt-2 font-serif text-[22px] font-black text-[#1a3a2e]">{stat.value}</p>
                        <p className="mt-1 text-[11px] text-[#6b7280]">{stat.helper}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#eef6e8] px-3 py-1 text-[11px] font-semibold text-[#61a740]">
                      {loyaltyMovementLabel(loyaltySummary.recentMovement)}
                    </span>
                    <span className="rounded-full bg-[#eef6e8] px-3 py-1 text-[11px] font-semibold text-[#61a740]">
                      {redemptionLabel(loyaltySummary.redemptionStatus)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="rounded-[14px] border border-dashed border-[rgba(26,58,46,0.14)] bg-[#faf8f3] px-4 py-5 text-sm leading-7 text-[#6b7280]">
                  Esta cuenta no expone loyalty hoy, o el servicio no devolvió datos. La sesión y la identidad siguen siendo válidas.
                </div>
              )}
            </HuelePanel>

            <HuelePanel tone="mint" className="p-8">
              <HueleBadge tone="green">Acciones</HueleBadge>
              <h3 className="mb-1 mt-4 text-[2rem] leading-tight text-[#1a3a2e]">Acciones rápidas</h3>
              <p className="mb-6 text-sm leading-7 text-[#6b7280]">Rutas disponibles desde tu cuenta.</p>
              <div className="space-y-3">
                <HueleButtonLink href="/catalogo" tone="dark" className="w-full">Ir al catálogo</HueleButtonLink>
                <HueleButtonLink href="/checkout" tone="secondary" className="w-full">Revisar checkout</HueleButtonLink>
                <HueleButtonLink href="/mayoristas" tone="secondary" className="w-full">Ver canal mayorista</HueleButtonLink>
              </div>
            </HuelePanel>
          </div>
        </div>
      </div>
      </HueleSection>
    </HuelePublicPage>
  );
}
