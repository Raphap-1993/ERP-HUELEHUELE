"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  CommissionPayoutStatus,
  CommissionStatus,
  OrderStatus,
  PaymentStatus,
  VendorStatus,
  type AuthCredentialsInput,
  type AuthSessionSummary,
  type SellerPanelOverviewSummary
} from "@huelegood/shared";
import { fetchSellerPanelOverview, fetchSession, login, logout } from "../lib/api";
import { hasSellerPortalAccess } from "../lib/portal-access";
import { clearStoredSessionToken, readStoredSessionToken, writeStoredSessionToken } from "../lib/session";
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Pendiente";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

const orderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.Draft]: "Borrador",
  [OrderStatus.PendingPayment]: "Pago pendiente",
  [OrderStatus.PaymentUnderReview]: "Pago en revisión",
  [OrderStatus.Paid]: "Pagado",
  [OrderStatus.Confirmed]: "Confirmado",
  [OrderStatus.Preparing]: "Preparando",
  [OrderStatus.Shipped]: "Enviado",
  [OrderStatus.Delivered]: "Entregado",
  [OrderStatus.Completed]: "Completado",
  [OrderStatus.Cancelled]: "Cancelado",
  [OrderStatus.Refunded]: "Reembolsado",
  [OrderStatus.Expired]: "Expirado"
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.Initiated]: "Iniciado",
  [PaymentStatus.Pending]: "Pendiente",
  [PaymentStatus.Authorized]: "Autorizado",
  [PaymentStatus.Paid]: "Pagado",
  [PaymentStatus.Failed]: "Fallido",
  [PaymentStatus.Expired]: "Expirado"
};

const commissionStatusLabels: Record<CommissionStatus, string> = {
  [CommissionStatus.PendingAttribution]: "Pendiente",
  [CommissionStatus.Attributed]: "Atribuida",
  [CommissionStatus.Approved]: "Aprobada",
  [CommissionStatus.Blocked]: "Bloqueada",
  [CommissionStatus.Payable]: "Por cobrar",
  [CommissionStatus.ScheduledForPayout]: "Programada",
  [CommissionStatus.Paid]: "Pagada",
  [CommissionStatus.Reversed]: "Revertida",
  [CommissionStatus.Cancelled]: "Cancelada"
};

const payoutStatusLabels: Record<CommissionPayoutStatus, string> = {
  [CommissionPayoutStatus.Draft]: "Borrador",
  [CommissionPayoutStatus.Approved]: "Aprobada",
  [CommissionPayoutStatus.Paid]: "Pagada",
  [CommissionPayoutStatus.Cancelled]: "Cancelada"
};

function statusTone(status: string): "green" | "neutral" | "amber" | "danger" {
  if (
    status === OrderStatus.Delivered ||
    status === OrderStatus.Completed ||
    status === OrderStatus.Paid ||
    status === PaymentStatus.Paid ||
    status === CommissionStatus.Paid ||
    status === CommissionPayoutStatus.Paid ||
    status === VendorStatus.Active
  ) {
    return "green";
  }

  if (
    status === OrderStatus.Cancelled ||
    status === OrderStatus.Refunded ||
    status === OrderStatus.Expired ||
    status === PaymentStatus.Failed ||
    status === PaymentStatus.Expired ||
    status === CommissionStatus.Cancelled ||
    status === CommissionStatus.Reversed ||
    status === CommissionStatus.Blocked ||
    status === CommissionPayoutStatus.Cancelled
  ) {
    return "danger";
  }

  if (
    status === OrderStatus.PendingPayment ||
    status === OrderStatus.PaymentUnderReview ||
    status === PaymentStatus.Pending ||
    status === PaymentStatus.Authorized ||
    status === CommissionStatus.Payable ||
    status === CommissionStatus.ScheduledForPayout ||
    status === CommissionPayoutStatus.Approved ||
    status === CommissionPayoutStatus.Draft
  ) {
    return "amber";
  }

  return "neutral";
}

// ── Inline visual primitives ──────────────────────────────────────────────────

function SPCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <HuelePanel tone="cream" className={className}>
      {children}
    </HuelePanel>
  );
}

function SPMetricCard({
  label,
  value,
  detail,
  tone = "green"
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "green" | "sage" | "gold" | "clay";
}) {
  const tones = {
    green: {
      surface: "bg-[var(--hh-public-surface)]",
      accent: "bg-[#61a740]",
      value: "text-[#1a3a2e]"
    },
    sage: {
      surface: "bg-[#eef6e8]",
      accent: "bg-[#8f9f80]",
      value: "text-[#243829]"
    },
    gold: {
      surface: "bg-[#fff7d8]",
      accent: "bg-[#c9a84c]",
      value: "text-[#6d5520]"
    },
    clay: {
      surface: "bg-[#ffe9df]",
      accent: "bg-[#d97845]",
      value: "text-[#7b3f24]"
    }
  }[tone];

  return (
    <div className={`min-h-[150px] rounded-[1.5rem] border border-[#162117]/8 ${tones.surface} p-5 shadow-[0_18px_55px_rgba(22,33,23,0.05)]`}>
      <div className={`mb-4 h-1.5 w-10 rounded-full ${tones.accent}`} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#667064]">{label}</p>
      <p className={`mt-3 font-serif text-[1.75rem] font-semibold leading-none ${tones.value}`}>{value}</p>
      {detail && <p className="mt-3 text-sm leading-6 text-[#5f675d]">{detail}</p>}
    </div>
  );
}

function SPBadge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "green" | "neutral" | "amber" | "danger" }) {
  const tones: Record<string, "cream" | "green" | "sun" | "coral"> = {
    default: "cream",
    green: "green",
    neutral: "cream",
    amber: "sun",
    danger: "coral"
  };
  return (
    <HueleBadge tone={tones[tone]}>
      {children}
    </HueleBadge>
  );
}

function SPTable({
  title,
  description,
  headers,
  rows
}: {
  title: string;
  description?: string;
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <HuelePanel tone="cream" className="overflow-hidden p-0">
      <div className="border-b border-[#162117]/8 bg-[#fbfaf6] px-6 py-5">
        <h3 className="font-serif text-[1.35rem] font-semibold text-[#1a3a2e]">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-[#6b7280]">{description}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr className="border-y border-[#162117]/8 bg-[#f2efe7]/70">
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#667064]">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-10 text-center text-sm text-[#6b7280]">
                  Sin registros todavía
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-b border-[#162117]/6 last:border-0 transition hover:bg-[#f7f1e6]/65">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3.5 align-middle text-sm text-[#162117]">
                      {cell ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </HuelePanel>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SellerPanelWorkspace() {
  const [session, setSession] = useState<AuthSessionSummary | null>(null);
  const [overview, setOverview] = useState<SellerPanelOverviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submittingLogin, setSubmittingLogin] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loginForm, setLoginForm] = useState<AuthCredentialsInput>({
    email: "",
    password: ""
  });

  useEffect(() => {
    let active = true;

    async function loadPanel() {
      const token = readStoredSessionToken();
      if (!token) {
        if (active) {
          setSession(null);
          setOverview(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const sessionResponse = await fetchSession(token);
        if (!active) return;

        if (!sessionResponse.data) {
          clearStoredSessionToken();
          setSession(null);
          setOverview(null);
          setLoading(false);
          return;
        }

        setSession(sessionResponse.data);

        if (!hasSellerPortalAccess(sessionResponse.data)) {
          setOverview(null);
          setLoading(false);
          return;
        }

        const overviewResponse = await fetchSellerPanelOverview(token);
        if (!active) return;

        setOverview(overviewResponse.data);
        setError(null);
        setAuthError(null);
      } catch (panelError) {
        if (active) {
          setOverview(null);
          setError(panelError instanceof Error ? panelError.message : "No pudimos cargar el panel vendedor.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPanel();
    return () => { active = false; };
  }, [refreshKey]);

  const orderRows = useMemo(
    () =>
      (overview?.recentOrders ?? []).map((order) => [
        order.orderNumber,
        order.customerName,
        formatCurrency(order.total),
        <SPBadge key={`${order.orderNumber}-status`} tone={statusTone(order.orderStatus)}>
          {orderStatusLabels[order.orderStatus]}
        </SPBadge>,
        <SPBadge key={`${order.orderNumber}-payment`} tone={statusTone(order.paymentStatus)}>
          {paymentStatusLabels[order.paymentStatus]}
        </SPBadge>,
        formatDateTime(order.confirmedAt ?? order.updatedAt)
      ]),
    [overview]
  );

  const commissionRows = useMemo(
    () =>
      (overview?.commissions ?? []).map((commission) => [
        commission.orderNumber,
        formatCurrency(commission.orderTotal),
        `${Math.round(commission.commissionRate * 100)}%`,
        formatCurrency(commission.commissionAmount),
        <SPBadge key={`${commission.id}-status`} tone={statusTone(commission.status)}>
          {commissionStatusLabels[commission.status]}
        </SPBadge>,
        commission.period
      ]),
    [overview]
  );

  const payoutRows = useMemo(
    () =>
      (overview?.payouts ?? []).map((payout) => [
        payout.id,
        payout.period,
        formatCurrency(payout.netAmount),
        <SPBadge key={`${payout.id}-status`} tone={statusTone(payout.status)}>
          {payoutStatusLabels[payout.status]}
        </SPBadge>,
        payout.referenceId ?? "Pendiente",
        formatDateTime(payout.paidAt ?? payout.updatedAt)
      ]),
    [overview]
  );

  const sellerCodeUrl = useMemo(() => {
    if (!overview?.seller.code) {
      return "";
    }

    if (typeof window === "undefined") {
      return overview.seller.code;
    }

    const url = new URL("/catalogo", window.location.origin);
    url.searchParams.set("vendedor", overview.seller.code);
    return url.toString();
  }, [overview?.seller.code]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingLogin(true);
    setAuthError(null);
    setError(null);

    try {
      const response = await login(loginForm);
      if (!response.data) {
        throw new Error("No pudimos iniciar sesión con esas credenciales.");
      }

      writeStoredSessionToken(response.data.token);
      setLoading(true);
      setSession(response.data);
      setRefreshKey((current) => current + 1);
    } catch (loginError) {
      setAuthError(loginError instanceof Error ? loginError.message : "No pudimos iniciar sesión.");
    } finally {
      setSubmittingLogin(false);
    }
  }

  async function handleLogout() {
    const token = readStoredSessionToken();
    try {
      await logout(token ?? undefined);
    } finally {
      clearStoredSessionToken();
      setSession(null);
      setOverview(null);
      setError(null);
      setAuthError(null);
    }
  }

  const metricTones: Array<"green" | "sage" | "gold" | "clay"> = ["green", "sage", "gold", "clay"];

  return (
    <HuelePublicPage
      eyebrow="Panel vendedor"
      title="Ventas, pedidos y liquidaciones"
      description="Consulta tu codigo vendedor, pedidos atribuidos, comisiones y pagos desde un panel operativo."
      actions={
        <>
          {session ? (
            <HueleButton type="button" tone="ghost" onClick={() => void handleLogout()}>
              Cerrar sesion
            </HueleButton>
          ) : null}
          <HueleButton
            type="button"
            tone="primary"
            onClick={() => setRefreshKey((current) => current + 1)}
            disabled={loading}
          >
            Refrescar
          </HueleButton>
        </>
      }
    >
      <HueleSection
        eyebrow="Workspace"
        title="Estado comercial"
        description="El contenido principal se mantiene en tablas y metricas para lectura rapida."
        actions={<HueleBadge tone={overview ? "green" : "cream"}>{overview ? "Overview activo" : "Esperando acceso"}</HueleBadge>}
      >
      <div className="space-y-8">
        {/* Loading */}
        {loading && (
          <HueleStatusCard title="Cargando panel" tone="cream">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#61a740] border-t-transparent" />
              <span className="text-sm text-[#6b7280]">Cargando panel vendedor...</span>
            </div>
          </HueleStatusCard>
        )}

        {/* No session */}
        {!loading && !session && (
          <SPCard className="grid overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-[var(--hh-public-green-950)] px-8 py-10 text-white md:px-10">
              <HueleBadge tone="mint">Acceso comercial</HueleBadge>
              <h2 className="mt-4 text-3xl leading-tight text-white">Entra a tu panel vendedor</h2>
              <p className="mt-3 max-w-sm text-sm leading-7 text-white/72">
                Usa tu cuenta aprobada para consultar tus ventas atribuidas, ganancias pendientes y liquidaciones pagadas.
              </p>
              <div className="mt-8 grid gap-3 text-sm text-white/72">
                <div className="rounded-[1rem] border border-white/14 bg-white/8 px-4 py-3">Ventas y pedidos por codigo.</div>
                <div className="rounded-[1rem] border border-white/14 bg-white/8 px-4 py-3">Comisiones y liquidaciones en un solo lugar.</div>
                <div className="rounded-[1rem] border border-white/14 bg-white/8 px-4 py-3">Acceso desde la web publica.</div>
              </div>
            </div>

            <div className="bg-[#fffdf8] px-8 py-8 md:px-10">
              <HueleBadge tone="sun">Ingreso</HueleBadge>
              <h3 className="mt-4 text-2xl text-[#1a3a2e]">Ingresar</h3>
              <p className="mt-1 text-sm text-[#6b7280]">Credenciales comerciales de Huelegood.</p>

              {authError ? (
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {authError}
                </div>
              ) : null}

              <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                <HueleFieldShell label="Correo electronico">
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="vendedor@correo.com"
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
                <HueleButton
                  type="submit"
                  disabled={submittingLogin}
                  tone="dark"
                  className="w-full"
                >
                  {submittingLogin ? "Validando..." : "Entrar al panel"}
                </HueleButton>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                <HueleButtonLink href="/trabaja-con-nosotros" tone="secondary">Solicitar acceso</HueleButtonLink>
                <HueleButtonLink href="/cuenta" tone="secondary">Mi cuenta</HueleButtonLink>
              </div>
            </div>
          </SPCard>
        )}

        {/* No access */}
        {!loading && session && !hasSellerPortalAccess(session) && (
          <SPCard className="p-8">
            <h2 className="mb-1 font-serif text-xl font-bold text-[#1a3a2e]">Cuenta sin acceso comercial</h2>
            <p className="mb-4 text-sm text-[#6b7280]">Tu cuenta aún no tiene acceso a esta sección.</p>
            <div className="mb-4 rounded-xl bg-black/[0.03] px-4 py-3 text-sm text-black/65">
              Sesión activa: {session.user.name} · {session.user.email}
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              {session.user.roles.map((role) => (
                <SPBadge key={role.code} tone="neutral">{role.label}</SPBadge>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <HueleButtonLink href="/cuenta" tone="secondary">Volver a mi cuenta</HueleButtonLink>
              <HueleButton
                type="button"
                onClick={() => { void handleLogout(); }}
                tone="secondary"
              >
                Cerrar sesión
              </HueleButton>
            </div>
          </SPCard>
        )}

        {/* Main panel */}
        {!loading && session && hasSellerPortalAccess(session) && overview && (
          <>
            {/* Identity + metrics */}
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              {/* Seller identity card */}
              <div className="relative overflow-hidden rounded-[1.5rem] border border-[#162117]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,245,237,0.92))] p-6 shadow-[0_18px_55px_rgba(22,33,23,0.05)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-[#577e2f]" />
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <SPBadge tone={statusTone(overview.seller.status)}>
                    {overview.seller.status === VendorStatus.Active ? "Activo" : overview.seller.status}
                  </SPBadge>
                  <SPBadge tone="neutral">Código activo</SPBadge>
                </div>
                <h2 className="font-serif text-2xl font-bold text-[#162117]">{overview.seller.name}</h2>
                <p className="mt-1 break-words text-sm text-[#5f675d]">
                  {overview.seller.code} · {session.user.email}
                </p>
                <div className="mt-5 grid grid-cols-1 gap-3 border-t border-[#162117]/8 pt-5 text-sm text-[#5f675d] sm:grid-cols-2">
                  <div className="rounded-[1rem] border border-[#162117]/8 bg-[#f7f1e6]/65 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#667064]">Aplicaciones</p>
                    <p className="mt-1 font-semibold text-[#162117]">{overview.seller.applicationsCount}</p>
                  </div>
                  <div className="rounded-[1rem] border border-[#162117]/8 bg-[#f7f1e6]/65 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#667064]">Pedidos atribuidos</p>
                    <p className="mt-1 font-semibold text-[#162117]">{overview.seller.ordersCount}</p>
                  </div>
                  <div className="rounded-[1rem] border border-[#162117]/8 bg-[#f7f1e6]/65 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#667064]">Ventas acumuladas</p>
                    <p className="mt-1 font-semibold text-[#162117]">{formatCurrency(overview.seller.sales)}</p>
                  </div>
                  <div className="rounded-[1rem] border border-[#162117]/8 bg-[#f7f1e6]/65 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#667064]">Comisiones consolidadas</p>
                    <p className="mt-1 font-semibold text-[#162117]">{formatCurrency(overview.seller.commissions)}</p>
                  </div>
                </div>
                <div className="mt-5 rounded-[1rem] border border-[#162117]/8 bg-white/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#667064]">Enlace comercial</p>
                  <p className="mt-2 break-all text-sm font-semibold text-[#162117]">{sellerCodeUrl}</p>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {overview.metrics.map((metric, index) => (
                  <SPMetricCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    detail={metric.detail}
                    tone={metricTones[index % metricTones.length]}
                  />
                ))}
              </div>
            </div>

            {/* Orders + Payouts */}
            <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
              <SPTable
                title="Pedidos atribuidos"
                description="Últimos pedidos registrados con tu código vendedor."
                headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Actualizado"]}
                rows={orderRows}
              />
              <SPTable
                title="Liquidaciones"
                description="Estado de tus pagos y movimientos."
                headers={["Liquidación", "Periodo", "Monto", "Estado", "Referencia", "Actualizado"]}
                rows={payoutRows}
              />
            </div>

            {/* Commissions */}
            <SPTable
              title="Detalle de comisiones"
              description="Comisiones por pedido y periodo comercial."
              headers={["Pedido", "Venta", "Tasa", "Comisión", "Estado", "Periodo"]}
              rows={commissionRows}
            />
          </>
        )}

        {/* Error */}
        {!loading && error && (
          <SPCard className="p-8">
            <h2 className="mb-1 font-serif text-xl font-bold text-[#1a3a2e]">No pudimos cargar tu panel</h2>
            <p className="mb-4 text-sm text-[#6b7280]">
              Tu cuenta aún no está activada como vendedora.
            </p>
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
            <HueleButtonLink href="/trabaja-con-nosotros" tone="secondary">Contactar al equipo comercial</HueleButtonLink>
          </SPCard>
        )}

      </div>
      </HueleSection>
    </HuelePublicPage>
  );
}
