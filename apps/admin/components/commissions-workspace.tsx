"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminDataTable,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  MetricCard,
  SectionHeader,
  Separator,
  StatusBadge,
  Textarea
} from "@huelegood/ui";
import type { CommissionPayoutSummary, CommissionRuleSummary, CommissionStatus, CommissionSummary, CommissionPayoutStatus, VendorSummary } from "@huelegood/shared";
import {
  createCommissionPayout,
  fetchCommissionPayouts,
  fetchCommissionRules,
  fetchCommissions,
  fetchVendors,
  settleCommissionPayout
} from "../lib/api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function currentPeriodKey() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "UTC"
  }).format(new Date());
}

function commissionTone(status: CommissionStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "paid") {
    return "success";
  }

  if (status === "payable" || status === "scheduled_for_payout") {
    return "warning";
  }

  if (status === "blocked" || status === "reversed" || status === "cancelled") {
    return "danger";
  }

  if (status === "pending_attribution" || status === "attributed" || status === "approved") {
    return "info";
  }

  return "neutral";
}

function payoutTone(status: CommissionPayoutStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "paid") {
    return "success";
  }

  if (status === "approved" || status === "draft") {
    return "warning";
  }

  if (status === "cancelled") {
    return "danger";
  }

  return "info";
}

export function CommissionsWorkspace() {
  const [commissions, setCommissions] = useState<CommissionSummary[]>([]);
  const [rules, setRules] = useState<CommissionRuleSummary[]>([]);
  const [payouts, setPayouts] = useState<CommissionPayoutSummary[]>([]);
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [selectedVendorCode, setSelectedVendorCode] = useState("VEND-014");
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriodKey());
  const [referenceId, setReferenceId] = useState("");
  const [notes, setNotes] = useState("Liquidación preparada desde el admin.");
  const [settlementReviewer, setSettlementReviewer] = useState("operador_pagos");
  const [settlementNotes, setSettlementNotes] = useState("Liquidación pagada y conciliada.");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);

      try {
        const [commissionsResponse, rulesResponse, payoutsResponse, vendorsResponse] = await Promise.all([
          fetchCommissions(),
          fetchCommissionRules(),
          fetchCommissionPayouts(),
          fetchVendors()
        ]);

        if (!active) {
          return;
        }

        setCommissions(commissionsResponse.data);
        setRules(rulesResponse.data);
        setPayouts(payoutsResponse.data);
        setVendors(vendorsResponse.data);
        setError(null);

        if (vendorsResponse.data[0] && !selectedVendorCode) {
          setSelectedVendorCode(vendorsResponse.data[0].code);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar las comisiones.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const metrics = useMemo(
    () => [
      {
        label: "Comisiones",
        value: String(commissions.length),
        detail: "Pedidos atribuidos a vendedor."
      },
      {
        label: "Pagables",
        value: String(commissions.filter((commission) => commission.status === "payable").length),
        detail: "Listas para liquidar."
      },
      {
        label: "Programadas",
        value: String(commissions.filter((commission) => commission.status === "scheduled_for_payout").length),
        detail: "Asignadas a un payout."
      },
      {
        label: "Pagadas",
        value: String(commissions.filter((commission) => commission.status === "paid").length),
        detail: "Conciliadas con liquidación."
      }
    ],
    [commissions]
  );

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  async function handleCreatePayout() {
    setActionLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await createCommissionPayout({
        vendorCode: selectedVendorCode.trim() || undefined,
        period: selectedPeriod.trim() || undefined,
        referenceId: referenceId.trim() || undefined,
        notes: notes.trim() || undefined
      });

      setFeedback(response.message);
      refresh();

      if (response.status === "queued") {
        window.setTimeout(refresh, 1200);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos crear la liquidación.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSettlePayout(payoutId: string) {
    setActionLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await settleCommissionPayout(payoutId, {
        reviewer: settlementReviewer.trim() || undefined,
        notes: settlementNotes.trim() || undefined
      });

      setFeedback(response.message);
      refresh();

      if (response.status === "queued") {
        window.setTimeout(refresh, 1200);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos liquidar el payout.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        title="Comisiones"
        description="Reglas, pedidos atribuidos, liquidaciones y conciliación con vendedores."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {feedback ? <p className="text-sm text-emerald-700">{feedback}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Nueva liquidación</CardTitle>
          <CardDescription>Selecciona vendedor y periodo para preparar un payout listo para pagar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1.3fr_auto]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="commission-vendor">
              Vendedor
            </label>
            <select
              id="commission-vendor"
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
              value={selectedVendorCode}
              onChange={(event) => setSelectedVendorCode(event.target.value)}
            >
              {vendors.map((vendor) => (
                <option key={vendor.code} value={vendor.code}>
                  {vendor.code} · {vendor.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="commission-period">
              Periodo
            </label>
            <Input
              id="commission-period"
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value)}
              placeholder="2026-03"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="commission-reference">
              Referencia
            </label>
            <Input
              id="commission-reference"
              value={referenceId}
              onChange={(event) => setReferenceId(event.target.value)}
              placeholder="TRX-0001"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="commission-notes">
              Notas
            </label>
            <Textarea
              id="commission-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Observaciones de la liquidación"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleCreatePayout} disabled={actionLoading}>
              Crear liquidación
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conciliación</CardTitle>
          <CardDescription>La liquidación cerrada actualiza la comisión y el snapshot del vendedor.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="settlement-reviewer">
              Revisor
            </label>
            <Input
              id="settlement-reviewer"
              value={settlementReviewer}
              onChange={(event) => setSettlementReviewer(event.target.value)}
              placeholder="operador_pagos"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="settlement-notes">
              Notas
            </label>
            <Input
              id="settlement-notes"
              value={settlementNotes}
              onChange={(event) => setSettlementNotes(event.target.value)}
              placeholder="Liquidación pagada"
            />
          </div>
          <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-4 text-sm text-black/60">
            Usa el botón de la tabla de liquidaciones para marcar como pagado el payout elegido.
          </div>
          <div className="flex items-end">
            <Button variant="secondary" onClick={refresh} disabled={loading || actionLoading}>
              Refrescar
            </Button>
          </div>
        </CardContent>
      </Card>

      <AdminDataTable
        title="Comisiones"
        description="Estado por pedido, monto calculado y relación con liquidación."
        headers={["Pedido", "Vendedor", "Código", "Total", "Rate", "Comisión", "Estado", "Periodo", "Payout"]}
        rows={commissions.map((commission) => [
          commission.orderNumber,
          commission.vendorName,
          commission.vendorCode,
          formatCurrency(commission.orderTotal),
          `${Math.round(commission.commissionRate * 100)}%`,
          formatCurrency(commission.commissionAmount),
          <StatusBadge key={`${commission.id}-status`} label={commission.status} tone={commissionTone(commission.status)} />,
          commission.period,
          commission.payoutId ?? "Pendiente"
        ])}
      />

      <AdminDataTable
        title="Reglas"
        description="Criterio activo para atribución y una regla reservada para mayoristas."
        headers={["Nombre", "Scope", "Rate", "Prioridad", "Estado"]}
        rows={rules.map((rule) => [
          rule.name,
          rule.scope,
          `${Math.round(rule.rate * 100)}%`,
          String(rule.priority),
          <StatusBadge
            key={`${rule.id}-rule`}
            label={rule.status}
            tone={rule.status === "active" ? "success" : "warning"}
          />
        ])}
      />

      <AdminDataTable
        title="Liquidaciones"
        description="Payouts listos para pago y conciliación final."
        headers={["Vendedor", "Periodo", "Bruto", "Neto", "Estado", "Comisiones", "Referencia", "Actualizado", "Acción"]}
        rows={payouts.map((payout) => [
          payout.vendorName,
          payout.period,
          formatCurrency(payout.grossAmount),
          formatCurrency(payout.netAmount),
          <StatusBadge key={`${payout.id}-payout`} label={payout.status} tone={payoutTone(payout.status)} />,
          String(payout.commissionIds.length),
          payout.referenceId ?? "Sin referencia",
          formatDate(payout.updatedAt),
          payout.status === "paid" || payout.status === "cancelled" ? (
            <span key={`${payout.id}-done`} className="text-sm text-black/45">
              Cerrada
            </span>
          ) : (
            <Button
              key={`${payout.id}-button`}
              size="sm"
              onClick={() => handleSettlePayout(payout.id)}
              disabled={actionLoading}
            >
              Marcar pagada
            </Button>
          )
        ])}
      />

      <Card>
        <CardHeader>
          <CardTitle>Vendedores con snapshot</CardTitle>
          <CardDescription>Resumen rápido de la base comercial que alimenta el cálculo de comisiones.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {vendors.slice(0, 4).map((vendor) => (
            <div key={vendor.code} className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-[#132016]">
                    {vendor.name} <span className="text-black/45">({vendor.code})</span>
                  </div>
                  <p className="text-sm text-black/55">{vendor.city ?? "Sin ciudad"} · {vendor.ordersCount} pedidos</p>
                </div>
                <StatusBadge label={vendor.status} tone={vendor.status === "active" ? "success" : "warning"} />
              </div>
              <div className="mt-3 grid gap-3 text-sm text-black/65 md:grid-cols-3">
                <p>Ventas: {formatCurrency(vendor.sales)}</p>
                <p>Comisiones: {formatCurrency(vendor.commissions)}</p>
                <p>Pagadas: {formatCurrency(vendor.paidCommissions)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      {loading ? <p className="text-sm text-black/55">Cargando comisiones...</p> : null}
      <Separator />
    </div>
  );
}
