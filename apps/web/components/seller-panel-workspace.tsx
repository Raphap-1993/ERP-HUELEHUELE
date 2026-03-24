"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleCode, type AuthSessionSummary, type SellerPanelOverviewSummary } from "@huelegood/shared";
import { AdminDataTable, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, MetricCard, SectionHeader } from "@huelegood/ui";
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
  if (!session) {
    return false;
  }

  const roles = session.user.roles.map((role) => role.code);
  return roles.includes(RoleCode.Vendedor) || roles.includes(RoleCode.SellerManager);
}

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
        if (!active) {
          return;
        }

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
        if (!active) {
          return;
        }

        setOverview(overviewResponse.data);
        setError(null);
      } catch (panelError) {
        if (active) {
          setOverview(null);
          setError(panelError instanceof Error ? panelError.message : "No pudimos cargar el panel vendedor.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPanel();

    return () => {
      active = false;
    };
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
    <div className="space-y-8 py-6 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          title="Panel vendedor"
          description="Consulta el rendimiento de tu código, tus pedidos atribuidos y el estado de tus liquidaciones."
        />
        <Button variant="secondary" onClick={() => setRefreshKey((current) => current + 1)} disabled={loading}>
          Refrescar
        </Button>
      </div>

      {loading ? <p className="text-sm text-black/55">Cargando panel vendedor...</p> : null}

      {!loading && !session ? (
        <Card>
          <CardHeader>
            <CardTitle>Acceso vendedor</CardTitle>
            <CardDescription>Inicia sesión con tu cuenta comercial desde Mi cuenta para ver ventas, comisiones y liquidaciones.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button href="/cuenta">Ir a mi cuenta</Button>
            <Button href="/catalogo" variant="secondary">
              Ver catálogo
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!loading && session && !hasSellerAccess(session) ? (
        <Card>
          <CardHeader>
            <CardTitle>Cuenta sin acceso comercial</CardTitle>
            <CardDescription>Esta sesión no tiene un rol vendedor habilitado para el panel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl bg-black/[0.03] p-4 text-sm text-black/65">
              Sesión activa: {session.user.name} · {session.user.email}
            </div>
            <div className="flex flex-wrap gap-2">
              {session.user.roles.map((role) => (
                <Badge key={role.code} tone="neutral">
                  {role.label}
                </Badge>
              ))}
            </div>
            <Button href="/cuenta" variant="secondary">
              Volver a mi cuenta
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!loading && session && hasSellerAccess(session) && overview ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <Card className="overflow-hidden border-[#132016]/10 bg-[linear-gradient(135deg,#132016_0%,#24412d_100%)] text-white">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-white/15 text-white">Código activo</Badge>
                  <Badge className="bg-emerald-200/20 text-white">{overview.seller.status}</Badge>
                </div>
                <CardTitle className="text-white">{overview.seller.name}</CardTitle>
                <CardDescription className="text-white/72">
                  {overview.seller.code} · {session.user.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/78">
                <p>Aplicaciones vinculadas: {overview.seller.applicationsCount}</p>
                <p>Pedidos atribuidos: {overview.seller.ordersCount}</p>
                <p>Ventas acumuladas: {formatCurrency(overview.seller.sales)}</p>
                <p>Comisiones consolidadas: {formatCurrency(overview.seller.commissions)}</p>
              </CardContent>
            </Card>

            <div className="grid gap-5 md:grid-cols-2">
              {overview.metrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <AdminDataTable
              title="Pedidos atribuidos"
              description="Últimos pedidos registrados con tu código vendedor."
              headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Actualizado"]}
              rows={orderRows}
            />
            <AdminDataTable
              title="Liquidaciones"
              description="Estado de tus pagos y referencias operativas."
              headers={["Liquidación", "Periodo", "Monto", "Estado", "Referencia", "Actualizado"]}
              rows={payoutRows}
            />
          </div>

          <AdminDataTable
            title="Detalle de comisiones"
            description="Comisiones por pedido y periodo comercial."
            headers={["Pedido", "Venta", "Tasa", "Comisión", "Estado", "Periodo"]}
            rows={commissionRows}
          />
        </>
      ) : null}

      {!loading && error ? (
        <Card>
          <CardHeader>
            <CardTitle>No pudimos cargar tu panel</CardTitle>
            <CardDescription>La cuenta existe, pero todavía no quedó enlazada al perfil vendedor operativo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
            <Button href="/trabaja-con-nosotros" variant="secondary">
              Contactar al equipo comercial
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
