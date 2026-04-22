"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RoleCode, type AuthSessionSummary, type SellerPanelOverviewSummary } from "@huelegood/shared";
import { fetchSellerPanelOverview, fetchSession } from "../lib/api";
import { clearStoredSessionToken, readStoredSessionToken } from "../lib/session";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0
  }).format(value);
}

function hasSellerAccess(session: AuthSessionSummary | null) {
  if (!session) return false;
  const roles = session.user.roles.map((role) => role.code);
  return roles.includes(RoleCode.Vendedor) || roles.includes(RoleCode.SellerManager);
}

// ── Inline visual primitives ──────────────────────────────────────────────────

function SPCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-black/6 bg-white shadow-[0_4px_24px_rgba(26,58,46,0.08)] ${className}`}>
      {children}
    </div>
  );
}

function SPMetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-black/6 bg-white p-5 shadow-[0_4px_24px_rgba(26,58,46,0.06)]">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">{label}</p>
      <p className="font-serif text-2xl font-black text-[#1a3a2e]">{value}</p>
      {detail && <p className="mt-1 text-xs text-[#6b7280]">{detail}</p>}
    </div>
  );
}

function SPBadge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "green" | "neutral" | "amber" }) {
  const styles: Record<string, string> = {
    default: "bg-[#eef6e8] text-[#61a740]",
    green: "bg-[#eef6e8] text-[#61a740]",
    neutral: "bg-black/6 text-black/60",
    amber: "bg-amber-50 text-amber-700"
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[tone]}`}>
      {children}
    </span>
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
  rows: (string | number | null | undefined)[][];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-[0_4px_24px_rgba(26,58,46,0.06)]">
      <div className="border-b border-black/6 px-6 py-5">
        <h3 className="font-semibold text-[#1a3a2e]">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-[#6b7280]">{description}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/6 bg-black/[0.02]">
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
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
                <tr key={i} className="border-b border-black/6 last:border-0 transition hover:bg-[#faf8f3]">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-sm text-[#1a3a2e]">
                      {cell ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SellerPanelWorkspace() {
  const [session, setSession] = useState<AuthSessionSummary | null>(null);
  const [overview, setOverview] = useState<SellerPanelOverviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

        if (!hasSellerAccess(sessionResponse.data)) {
          setOverview(null);
          setLoading(false);
          return;
        }

        const overviewResponse = await fetchSellerPanelOverview(token);
        if (!active) return;

        setOverview(overviewResponse.data);
        setError(null);
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
        order.orderStatus,
        order.paymentStatus,
        order.updatedAt
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
        commission.status,
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
        payout.status,
        payout.referenceId ?? "Pendiente",
        payout.updatedAt
      ]),
    [overview]
  );

  return (
    <div className="min-h-screen bg-[#faf8f3] py-10 md:py-14">
      <div className="mx-auto max-w-[1120px] space-y-8 px-4 md:px-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-black leading-tight text-[#1a3a2e] md:text-4xl">
              Panel vendedor
            </h1>
            <p className="mt-1 text-sm text-[#6b7280]">
              Consulta el rendimiento de tu código, tus pedidos atribuidos y el estado de tus liquidaciones.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-[#61a740]/30 bg-white px-5 py-2.5 text-sm font-medium text-[#1a3a2e] shadow-sm transition hover:border-[#61a740] hover:bg-[#eef6e8] disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.42" />
            </svg>
            Refrescar
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 rounded-2xl border border-black/6 bg-white px-6 py-8 shadow-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#61a740] border-t-transparent" />
            <span className="text-sm text-[#6b7280]">Cargando panel vendedor...</span>
          </div>
        )}

        {/* No session */}
        {!loading && !session && (
          <SPCard className="overflow-hidden">
            <div className="bg-[linear-gradient(135deg,#1a3a2e_0%,#61a740_100%)] px-8 py-10 text-white">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-2xl">
                🏷️
              </div>
              <h2 className="font-serif text-2xl font-bold">Acceso vendedor</h2>
              <p className="mt-2 max-w-sm text-sm text-white/75">
                Inicia sesión con tu cuenta comercial desde Mi cuenta para ver ventas, comisiones y liquidaciones.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 px-8 py-6">
              <Link
                href="/cuenta"
                className="inline-flex items-center gap-2 rounded-full bg-[#577e2f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#61a740]"
              >
                Ir a mi cuenta
              </Link>
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 rounded-full border border-[#1a3a2e]/20 px-6 py-3 text-sm font-medium text-[#1a3a2e] transition hover:border-[#61a740] hover:bg-[#eef6e8]"
              >
                Ver catálogo
              </Link>
            </div>
          </SPCard>
        )}

        {/* No access */}
        {!loading && session && !hasSellerAccess(session) && (
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
            <Link
              href="/cuenta"
              className="inline-flex items-center gap-2 rounded-full border border-[#1a3a2e]/20 px-5 py-2.5 text-sm font-medium text-[#1a3a2e] transition hover:border-[#61a740] hover:bg-[#eef6e8]"
            >
              Volver a mi cuenta
            </Link>
          </SPCard>
        )}

        {/* Main panel */}
        {!loading && session && hasSellerAccess(session) && overview && (
          <>
            {/* Identity + metrics */}
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              {/* Seller identity card */}
              <div className="overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#1a3a2e_0%,#61a740_100%)] p-7 text-white shadow-[0_8px_32px_rgba(26,58,46,0.25)]">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <SPBadge tone="green">{overview.seller.status}</SPBadge>
                  <SPBadge tone="neutral">Código activo</SPBadge>
                </div>
                <h2 className="font-serif text-2xl font-bold text-white">{overview.seller.name}</h2>
                <p className="mt-1 text-sm text-white/65">
                  {overview.seller.code} · {session.user.email}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/15 pt-5 text-sm text-white/75">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-white/45">Aplicaciones</p>
                    <p className="font-semibold text-white">{overview.seller.applicationsCount}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-white/45">Pedidos atribuidos</p>
                    <p className="font-semibold text-white">{overview.seller.ordersCount}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-white/45">Ventas acumuladas</p>
                    <p className="font-semibold text-white">{formatCurrency(overview.seller.sales)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-white/45">Comisiones consolidadas</p>
                    <p className="font-semibold text-white">{formatCurrency(overview.seller.commissions)}</p>
                  </div>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-4">
                {overview.metrics.map((metric) => (
                  <SPMetricCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
                ))}
              </div>
            </div>

            {/* Orders + Payouts */}
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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
            <Link
              href="/trabaja-con-nosotros"
              className="inline-flex items-center gap-2 rounded-full border border-[#1a3a2e]/20 px-5 py-2.5 text-sm font-medium text-[#1a3a2e] transition hover:border-[#61a740] hover:bg-[#eef6e8]"
            >
              Contactar al equipo comercial
            </Link>
          </SPCard>
        )}

      </div>
    </div>
  );
}
