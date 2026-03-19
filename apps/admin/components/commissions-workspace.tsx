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
import type {
  CommissionPayoutStatus,
  CommissionPayoutSummary,
  CommissionRuleInput,
  CommissionRuleSummary,
  CommissionStatus,
  CommissionSummary,
  VendorSummary
} from "@huelegood/shared";
import {
  createCommissionPayout,
  createCommissionRule,
  fetchCommissionPayouts,
  fetchCommissionRules,
  fetchCommissions,
  fetchVendors,
  settleCommissionPayout,
  updateCommissionRule
} from "../lib/api";

function formatCurrency(value?: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(value ?? 0);
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

  if (status === "approved" || status === "attributed" || status === "pending_attribution") {
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

function parseOptionalNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function createEmptyRuleForm(): CommissionRuleInput {
  return {
    name: "",
    description: "",
    scope: "seller_code",
    rate: 0.15,
    paymentMethod: "any",
    appliesToVendorCode: "",
    minOrderTotal: undefined,
    maxOrderTotal: undefined,
    payoutDelayDays: 0,
    notes: "",
    priority: 1,
    status: "active"
  };
}

export function CommissionsWorkspace() {
  const [commissions, setCommissions] = useState<CommissionSummary[]>([]);
  const [rules, setRules] = useState<CommissionRuleSummary[]>([]);
  const [payouts, setPayouts] = useState<CommissionPayoutSummary[]>([]);
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [selectedVendorCode, setSelectedVendorCode] = useState("VEND-014");
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriodKey());
  const [referenceId, setReferenceId] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusReason, setBonusReason] = useState("");
  const [deductionAmount, setDeductionAmount] = useState("");
  const [deductionReason, setDeductionReason] = useState("");
  const [notes, setNotes] = useState("Liquidación preparada desde el admin.");
  const [settlementReviewer, setSettlementReviewer] = useState("operador_pagos");
  const [settlementNotes, setSettlementNotes] = useState("Liquidación pagada y conciliada.");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState<CommissionRuleInput>(createEmptyRuleForm());
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

        if (!selectedVendorCode && vendorsResponse.data[0]) {
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
  }, [refreshKey, selectedVendorCode]);

  const metrics = useMemo(
    () => [
      {
        label: "Comisiones",
        value: String(commissions.length),
        detail: "Pedidos atribuidos a vendedor."
      },
      {
        label: "En ventana",
        value: String(commissions.filter((commission) => commission.status === "approved").length),
        detail: "Aprobadas pero aún no pagables."
      },
      {
        label: "Pagables",
        value: String(commissions.filter((commission) => commission.status === "payable").length),
        detail: "Listas para liquidar."
      },
      {
        label: "Reglas activas",
        value: String(rules.filter((rule) => rule.status === "active").length),
        detail: "Motor vigente para cálculo comercial."
      }
    ],
    [commissions, rules]
  );

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function resetRuleForm() {
    setEditingRuleId(null);
    setRuleForm(createEmptyRuleForm());
  }

  function loadRuleIntoForm(rule: CommissionRuleSummary) {
    setEditingRuleId(rule.id);
    setRuleForm({
      name: rule.name,
      description: rule.description,
      scope: rule.scope,
      rate: rule.rate,
      paymentMethod: rule.paymentMethod ?? "any",
      appliesToVendorCode: rule.appliesToVendorCode ?? "",
      minOrderTotal: rule.minOrderTotal,
      maxOrderTotal: rule.maxOrderTotal,
      payoutDelayDays: rule.payoutDelayDays,
      notes: rule.notes ?? "",
      priority: rule.priority,
      status: rule.status
    });
  }

  async function handleSaveRule() {
    setActionLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const payload: CommissionRuleInput = {
        ...ruleForm,
        appliesToVendorCode: ruleForm.appliesToVendorCode?.trim() || undefined,
        notes: ruleForm.notes?.trim() || undefined,
        minOrderTotal: ruleForm.minOrderTotal,
        maxOrderTotal: ruleForm.maxOrderTotal,
        payoutDelayDays: ruleForm.payoutDelayDays ?? 0,
        priority: ruleForm.priority ?? 1
      };

      const response = editingRuleId
        ? await updateCommissionRule(editingRuleId, payload)
        : await createCommissionRule(payload);

      setFeedback(response.message);
      resetRuleForm();
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos guardar la regla.");
    } finally {
      setActionLoading(false);
    }
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
        bonusAmount: parseOptionalNumber(bonusAmount),
        bonusReason: bonusReason.trim() || undefined,
        deductionAmount: parseOptionalNumber(deductionAmount),
        deductionReason: deductionReason.trim() || undefined,
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
        description="Motor de reglas, ventanas de elegibilidad, liquidaciones con ajustes y conciliación final."
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{editingRuleId ? "Editar regla" : "Nueva regla"}</CardTitle>
              <CardDescription>Define prioridad, método de pago, ticket y espera antes de volver una comisión pagable.</CardDescription>
            </div>
            <Button variant="secondary" onClick={resetRuleForm}>
              Nueva regla
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="rule-name">
                Nombre
              </label>
              <Input
                id="rule-name"
                value={ruleForm.name}
                onChange={(event) => setRuleForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Comisión seller-first Openpay"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="rule-scope">
                Scope
              </label>
              <select
                id="rule-scope"
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                value={ruleForm.scope}
                onChange={(event) =>
                  setRuleForm((current) => ({
                    ...current,
                    scope: event.target.value as CommissionRuleInput["scope"]
                  }))
                }
              >
                <option value="seller_code">seller_code</option>
                <option value="vendor">vendor</option>
                <option value="payment_method">payment_method</option>
                <option value="order_total">order_total</option>
                <option value="wholesale">wholesale</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="rule-payment-method">
                Método de pago
              </label>
              <select
                id="rule-payment-method"
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                value={ruleForm.paymentMethod ?? "any"}
                onChange={(event) =>
                  setRuleForm((current) => ({
                    ...current,
                    paymentMethod: event.target.value as CommissionRuleInput["paymentMethod"]
                  }))
                }
              >
                <option value="any">Cualquiera</option>
                <option value="openpay">Openpay</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="rule-status">
                Estado
              </label>
              <select
                id="rule-status"
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                value={ruleForm.status ?? "active"}
                onChange={(event) =>
                  setRuleForm((current) => ({
                    ...current,
                    status: event.target.value as CommissionRuleInput["status"]
                  }))
                }
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="rule-vendor-code">
                Vendor code
              </label>
              <select
                id="rule-vendor-code"
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                value={ruleForm.appliesToVendorCode ?? ""}
                onChange={(event) => setRuleForm((current) => ({ ...current, appliesToVendorCode: event.target.value }))}
              >
                <option value="">Todos</option>
                {vendors.map((vendor) => (
                  <option key={vendor.code} value={vendor.code}>
                    {vendor.code} · {vendor.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="rule-rate">
                Tasa
              </label>
              <Input
                id="rule-rate"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={String(ruleForm.rate)}
                onChange={(event) =>
                  setRuleForm((current) => ({ ...current, rate: Number(event.target.value) || 0 }))
                }
                placeholder="0.15"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="rule-priority">
                Prioridad
              </label>
              <Input
                id="rule-priority"
                type="number"
                min="0"
                step="1"
                value={String(ruleForm.priority ?? 1)}
                onChange={(event) =>
                  setRuleForm((current) => ({ ...current, priority: Number(event.target.value) || 0 }))
                }
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="rule-delay">
                Espera payout (días)
              </label>
              <Input
                id="rule-delay"
                type="number"
                min="0"
                step="1"
                value={String(ruleForm.payoutDelayDays ?? 0)}
                onChange={(event) =>
                  setRuleForm((current) => ({ ...current, payoutDelayDays: Number(event.target.value) || 0 }))
                }
                placeholder="2"
              />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="rule-min">
                Ticket mínimo
              </label>
              <Input
                id="rule-min"
                type="number"
                min="0"
                step="1"
                value={ruleForm.minOrderTotal ?? ""}
                onChange={(event) =>
                  setRuleForm((current) => ({ ...current, minOrderTotal: parseOptionalNumber(event.target.value) }))
                }
                placeholder="300"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="rule-max">
                Ticket máximo
              </label>
              <Input
                id="rule-max"
                type="number"
                min="0"
                step="1"
                value={ruleForm.maxOrderTotal ?? ""}
                onChange={(event) =>
                  setRuleForm((current) => ({ ...current, maxOrderTotal: parseOptionalNumber(event.target.value) }))
                }
                placeholder="1500"
              />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="rule-description">
                Descripción
              </label>
              <Textarea
                id="rule-description"
                value={ruleForm.description}
                onChange={(event) => setRuleForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Regla base para sellers activos."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="rule-notes">
                Notas
              </label>
              <Textarea
                id="rule-notes"
                value={ruleForm.notes ?? ""}
                onChange={(event) => setRuleForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Observaciones operativas."
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSaveRule} disabled={actionLoading}>
                {editingRuleId ? "Actualizar regla" : "Crear regla"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nueva liquidación</CardTitle>
          <CardDescription>Prepara payouts con bonos o deducciones antes de conciliarlos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-4">
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
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="payout-bonus-amount">
                Bono
              </label>
              <Input
                id="payout-bonus-amount"
                type="number"
                min="0"
                step="1"
                value={bonusAmount}
                onChange={(event) => setBonusAmount(event.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="payout-bonus-reason">
                Motivo bono
              </label>
              <Input
                id="payout-bonus-reason"
                value={bonusReason}
                onChange={(event) => setBonusReason(event.target.value)}
                placeholder="Bono comercial"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="payout-deduction-amount">
                Deducción
              </label>
              <Input
                id="payout-deduction-amount"
                type="number"
                min="0"
                step="1"
                value={deductionAmount}
                onChange={(event) => setDeductionAmount(event.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="payout-deduction-reason">
                Motivo deducción
              </label>
              <Input
                id="payout-deduction-reason"
                value={deductionReason}
                onChange={(event) => setDeductionReason(event.target.value)}
                placeholder="Ajuste operativo"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreatePayout} disabled={actionLoading}>
              Crear liquidación
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conciliación</CardTitle>
          <CardDescription>La liquidación pagada cierra comisiones y actualiza el snapshot del vendedor.</CardDescription>
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
        description="Regla aplicada, elegibilidad, monto calculado y relación con payout."
        headers={["Pedido", "Vendedor", "Regla", "Total", "Comisión", "Estado", "Elegible", "Payout", "Observación"]}
        rows={commissions.map((commission) => [
          commission.orderNumber,
          `${commission.vendorName} (${commission.vendorCode})`,
          commission.ruleName,
          formatCurrency(commission.orderTotal),
          `${formatCurrency(commission.commissionAmount)} · ${Math.round(commission.commissionRate * 100)}%`,
          <StatusBadge key={`${commission.id}-status`} label={commission.status} tone={commissionTone(commission.status)} />,
          formatDate(commission.eligibleAt),
          commission.payoutId ?? "Pendiente",
          commission.blockedReason ?? "Sin observación"
        ])}
      />

      <AdminDataTable
        title="Reglas"
        description="Motor activo para cálculo comercial, filtros y espera antes de payout."
        headers={["Nombre", "Scope", "Método", "Filtro", "Ticket", "Delay", "Rate", "Prioridad", "Estado", "Acción"]}
        rows={rules.map((rule) => [
          rule.name,
          rule.scope,
          rule.paymentMethod ?? "any",
          rule.appliesToVendorCode ?? "Todos",
          `${rule.minOrderTotal ? formatCurrency(rule.minOrderTotal) : "Sin mínimo"} / ${rule.maxOrderTotal ? formatCurrency(rule.maxOrderTotal) : "Sin máximo"}`,
          `${rule.payoutDelayDays} día(s)`,
          `${Math.round(rule.rate * 100)}%`,
          String(rule.priority),
          <StatusBadge key={`${rule.id}-rule`} label={rule.status} tone={rule.status === "active" ? "success" : "warning"} />,
          <Button key={`${rule.id}-edit`} size="sm" variant="secondary" onClick={() => loadRuleIntoForm(rule)}>
            Editar
          </Button>
        ])}
      />

      <AdminDataTable
        title="Liquidaciones"
        description="Payouts listos para pago con ajustes netos explícitos."
        headers={["Vendedor", "Periodo", "Bruto", "Bono", "Deducción", "Neto", "Estado", "Referencia", "Actualizado", "Acción"]}
        rows={payouts.map((payout) => [
          payout.vendorName,
          payout.period,
          formatCurrency(payout.grossAmount),
          payout.bonusAmount ? `${formatCurrency(payout.bonusAmount)} · ${payout.bonusReason ?? "Sin motivo"}` : "Sin bono",
          payout.deductionAmount ? `${formatCurrency(payout.deductionAmount)} · ${payout.deductionReason ?? "Sin motivo"}` : "Sin deducción",
          formatCurrency(payout.netAmount),
          <StatusBadge key={`${payout.id}-payout`} label={payout.status} tone={payoutTone(payout.status)} />,
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
          <CardDescription>Resumen comercial consolidado que alimenta comisiones y seller panel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {vendors.slice(0, 6).map((vendor) => (
            <div key={vendor.code} className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-[#132016]">
                    {vendor.name} <span className="text-black/45">({vendor.code})</span>
                  </div>
                  <p className="text-sm text-black/55">
                    {vendor.city ?? "Sin ciudad"} · {vendor.ordersCount} pedidos
                  </p>
                </div>
                <StatusBadge label={vendor.status} tone={vendor.status === "active" ? "success" : "warning"} />
              </div>
              <div className="mt-3 grid gap-3 text-sm text-black/65 md:grid-cols-4">
                <p>Ventas: {formatCurrency(vendor.sales)}</p>
                <p>Comisiones: {formatCurrency(vendor.commissions)}</p>
                <p>Pendientes: {formatCurrency(vendor.pendingCommissions)}</p>
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
