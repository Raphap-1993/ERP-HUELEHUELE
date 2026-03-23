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
  StatusBadge,
  Textarea
} from "@huelegood/ui";
import {
  LoyaltyMovementStatus,
  RedemptionStatus,
  loyaltyOverview,
  type LoyaltyAccountSummary,
  type LoyaltyMovementSummary,
  type LoyaltyPointsInput,
  type LoyaltyRedemptionSummary,
  type LoyaltyRuleSummary
} from "@huelegood/shared";
import {
  assignLoyaltyPoints,
  createLoyaltyRedemption,
  fetchLoyaltyAccounts,
  fetchLoyaltyMovements,
  fetchLoyaltyRedemptions,
  fetchLoyaltyRules,
  updateLoyaltyRedemptionStatus
} from "../lib/api";

function formatDate(value?: string) {
  if (!value) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function movementTone(status: LoyaltyMovementStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === LoyaltyMovementStatus.Available) {
    return "success";
  }

  if (status === LoyaltyMovementStatus.Pending) {
    return "warning";
  }

  if (status === LoyaltyMovementStatus.Reversed) {
    return "danger";
  }

  return "neutral";
}

function redemptionTone(status: RedemptionStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === RedemptionStatus.Applied) {
    return "success";
  }

  if (status === RedemptionStatus.Pending) {
    return "warning";
  }

  if (status === RedemptionStatus.Cancelled) {
    return "danger";
  }

  return "neutral";
}

function movementStatusLabel(status: LoyaltyMovementStatus) {
  const labels: Record<LoyaltyMovementStatus, string> = {
    pending: "Pendiente",
    available: "Disponible",
    reversed: "Revertido",
    expired: "Expirado"
  };

  return labels[status];
}

function redemptionStatusLabel(status: RedemptionStatus) {
  const labels: Record<RedemptionStatus, string> = {
    pending: "Pendiente",
    applied: "Aplicado",
    cancelled: "Cancelado"
  };

  return labels[status];
}

function ruleStatusLabel(status: LoyaltyRuleSummary["status"]) {
  return status === "active" ? "Activo" : "Inactivo";
}

function movementKindLabel(kind: LoyaltyPointsInput["kind"] | LoyaltyMovementSummary["kind"]) {
  const labels: Record<string, string> = {
    earn: "Acumulación",
    redeem: "Canje",
    adjustment: "Ajuste",
    bonus: "Bonificación"
  };

  return labels[kind ?? "earn"] ?? kind;
}

export function LoyaltyWorkspace() {
  const [accounts, setAccounts] = useState<LoyaltyAccountSummary[]>(loyaltyOverview);
  const [movements, setMovements] = useState<LoyaltyMovementSummary[]>([]);
  const [redemptions, setRedemptions] = useState<LoyaltyRedemptionSummary[]>([]);
  const [rules, setRules] = useState<LoyaltyRuleSummary[]>([]);
  const [customer, setCustomer] = useState(loyaltyOverview[0]?.customer ?? "Laura M.");
  const [points, setPoints] = useState("20");
  const [reason, setReason] = useState("Bonificación manual");
  const [orderNumber, setOrderNumber] = useState("");
  const [movementKind, setMovementKind] = useState<LoyaltyPointsInput["kind"]>("bonus");
  const [movementStatus, setMovementStatus] = useState<LoyaltyMovementStatus>(LoyaltyMovementStatus.Available);
  const [pointsReviewer, setPointsReviewer] = useState("operaciones");
  const [redemptionCustomer, setRedemptionCustomer] = useState(loyaltyOverview[0]?.customer ?? "Laura M.");
  const [reward, setReward] = useState("Descuento próxima compra");
  const [redemptionPoints, setRedemptionPoints] = useState("30");
  const [redemptionNotes, setRedemptionNotes] = useState("Canje registrado desde operación");
  const [redemptionReviewer, setRedemptionReviewer] = useState("operaciones");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);

      try {
        const [accountsResponse, movementsResponse, redemptionsResponse, rulesResponse] = await Promise.all([
          fetchLoyaltyAccounts(),
          fetchLoyaltyMovements(),
          fetchLoyaltyRedemptions(),
          fetchLoyaltyRules()
        ]);

        if (!active) {
          return;
        }

        setAccounts(accountsResponse.data);
        setMovements(movementsResponse.data);
        setRedemptions(redemptionsResponse.data);
        setRules(rulesResponse.data);
        setError(null);
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar loyalty.");
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

  useEffect(() => {
    if (!accounts.length) {
      return;
    }

    if (!customer || !accounts.some((account) => account.customer === customer)) {
      setCustomer(accounts[0].customer);
    }

    if (!redemptionCustomer || !accounts.some((account) => account.customer === redemptionCustomer)) {
      setRedemptionCustomer(accounts[0].customer);
    }
  }, [accounts, customer, redemptionCustomer]);

  const metrics = useMemo(
    () => [
      {
        label: "Cuentas",
        value: String(accounts.length),
        detail: "Clientes con historial de puntos."
      },
      {
        label: "Disponibles",
        value: String(accounts.reduce((sum, account) => sum + account.availablePoints, 0)),
        detail: "Saldo listo para canje."
      },
      {
        label: "Pendientes",
        value: String(accounts.reduce((sum, account) => sum + account.pendingPoints, 0)),
        detail: "Puntos retenidos o en revisión."
      },
      {
        label: "Canjes",
        value: String(redemptions.filter((redemption) => redemption.status === RedemptionStatus.Pending).length),
        detail: "Solicitudes activas."
      }
    ],
    [accounts, redemptions]
  );

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  async function handleAssignPoints() {
    setActionLoading(true);
    setError(null);

    try {
      await assignLoyaltyPoints({
        customer: customer.trim(),
        points: Number(points),
        reason: reason.trim(),
        orderNumber: orderNumber.trim() || undefined,
        kind: movementKind ?? undefined,
        status: movementStatus,
        reviewer: pointsReviewer.trim() || undefined
      });
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos registrar los puntos.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateRedemption() {
    setActionLoading(true);
    setError(null);

    try {
      await createLoyaltyRedemption({
        customer: redemptionCustomer.trim(),
        reward: reward.trim(),
        points: Number(redemptionPoints),
        notes: redemptionNotes.trim() || undefined,
        reviewer: redemptionReviewer.trim() || undefined
      });
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos registrar el canje.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRedemptionDecision(id: string, status: RedemptionStatus.Applied | RedemptionStatus.Cancelled) {
    setActionLoading(true);
    setError(null);

    try {
      await updateLoyaltyRedemptionStatus(id, {
        status,
        reviewer: redemptionReviewer.trim() || undefined,
        notes: `${status === RedemptionStatus.Applied ? "Canje aplicado" : "Canje cancelado"} desde operación.`
      });
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos actualizar el canje.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        title="Fidelización"
        description="Puntos, canjes y reglas de fidelización integradas con checkout y operación."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Asignación de puntos</CardTitle>
            <CardDescription>Registra acumulación manual o derivada de pedidos confirmados.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="loyalty-customer">
                Cliente
              </label>
              <Input id="loyalty-customer" value={customer} onChange={(event) => setCustomer(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="loyalty-points">
                Puntos
              </label>
              <Input
                id="loyalty-points"
                type="number"
                min="1"
                step="1"
                value={points}
                onChange={(event) => setPoints(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="loyalty-kind">
                Tipo
              </label>
              <select
                id="loyalty-kind"
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                value={movementKind ?? "bonus"}
                onChange={(event) => setMovementKind(event.target.value as LoyaltyPointsInput["kind"])}
              >
                <option value="earn">Acumulación</option>
                <option value="bonus">Bonificación</option>
                <option value="adjustment">Ajuste</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="loyalty-status">
                Estado
              </label>
              <select
                id="loyalty-status"
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                value={movementStatus}
                onChange={(event) => setMovementStatus(event.target.value as LoyaltyMovementStatus)}
              >
                <option value={LoyaltyMovementStatus.Available}>Disponible</option>
                <option value={LoyaltyMovementStatus.Pending}>Pendiente</option>
                <option value={LoyaltyMovementStatus.Reversed}>Revertido</option>
                <option value={LoyaltyMovementStatus.Expired}>Expirado</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="loyalty-order">
                Pedido asociado
              </label>
              <Input
                id="loyalty-order"
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="HG-10042"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="loyalty-reason">
                Motivo
              </label>
              <Textarea
                id="loyalty-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Describe la razón de la asignación"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="loyalty-reviewer">
                Revisor
              </label>
              <Input
                id="loyalty-reviewer"
                value={pointsReviewer}
                onChange={(event) => setPointsReviewer(event.target.value)}
                placeholder="operaciones"
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleAssignPoints} disabled={actionLoading}>
                {actionLoading ? "Guardando..." : "Registrar puntos"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Canjes</CardTitle>
            <CardDescription>Solicitudes pendientes y resolución operativa.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="redemption-customer">
                Cliente
              </label>
              <Input
                id="redemption-customer"
                value={redemptionCustomer}
                onChange={(event) => setRedemptionCustomer(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="redemption-points">
                Puntos
              </label>
              <Input
                id="redemption-points"
                type="number"
                min="1"
                step="1"
                value={redemptionPoints}
                onChange={(event) => setRedemptionPoints(event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="redemption-reward">
                Recompensa
              </label>
              <Input
                id="redemption-reward"
                value={reward}
                onChange={(event) => setReward(event.target.value)}
                placeholder="Descuento próxima compra"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="redemption-notes">
                Notas
              </label>
              <Textarea
                id="redemption-notes"
                value={redemptionNotes}
                onChange={(event) => setRedemptionNotes(event.target.value)}
                placeholder="Notas del canje"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="redemption-reviewer">
                Revisor
              </label>
              <Input
                id="redemption-reviewer"
                value={redemptionReviewer}
                onChange={(event) => setRedemptionReviewer(event.target.value)}
                placeholder="operaciones"
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleCreateRedemption} disabled={actionLoading}>
                {actionLoading ? "Guardando..." : "Crear canje"}
              </Button>
            </div>
          </CardContent>
        </Card>

      <AdminDataTable
        title="Cuentas loyalty"
        description="Saldo por cliente y estado de canjes."
        headers={["Cliente", "Disponibles", "Pendientes", "Canjeados", "Último movimiento", "Canje"]}
        rows={accounts.map((account) => [
          account.customer,
          String(account.availablePoints),
          String(account.pendingPoints),
          String(account.redeemedPoints),
          <StatusBadge
            key={`${account.customer}-movement`}
            label={movementStatusLabel(account.recentMovement)}
            tone={movementTone(account.recentMovement)}
          />,
          <StatusBadge
            key={`${account.customer}-redemption`}
            label={redemptionStatusLabel(account.redemptionStatus)}
            tone={redemptionTone(account.redemptionStatus)}
          />
        ])}
      />

      <AdminDataTable
        title="Movimientos"
        description="Historial de acumulaciones, ajustes y canjes."
        headers={["Cliente", "Tipo", "Puntos", "Estado", "Saldo final", "Motivo", "Pedido", "Actualizado"]}
        rows={movements.map((movement) => [
          movement.customer,
          movementKindLabel(movement.kind),
          String(movement.points),
          <StatusBadge
            key={`${movement.id}-status`}
            label={movementStatusLabel(movement.status)}
            tone={movementTone(movement.status)}
          />,
          String(movement.balanceAfter),
          movement.reason,
          movement.orderNumber ?? "-",
          formatDate(movement.updatedAt)
        ])}
      />

      <AdminDataTable
        title="Canjes"
        description="Solicitudes de redención y decisiones operativas."
        headers={["Cliente", "Recompensa", "Puntos", "Estado", "Revisor", "Actualizado", "Acciones"]}
        rows={redemptions.map((redemption) => [
          redemption.customer,
          redemption.reward,
          String(redemption.points),
          <StatusBadge
            key={`${redemption.id}-status`}
            label={redemptionStatusLabel(redemption.status)}
            tone={redemptionTone(redemption.status)}
          />,
          redemption.reviewer ?? "-",
          formatDate(redemption.updatedAt),
          <div key={`${redemption.id}-actions`} className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleRedemptionDecision(redemption.id, RedemptionStatus.Applied)}
              disabled={actionLoading || redemption.status !== RedemptionStatus.Pending}
            >
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleRedemptionDecision(redemption.id, RedemptionStatus.Cancelled)}
              disabled={actionLoading || redemption.status !== RedemptionStatus.Pending}
            >
              Cancelar
            </Button>
          </div>
        ])}
      />

      <AdminDataTable
        title="Reglas"
        description="Base operativa para acumulación y bonificaciones."
        headers={["Regla", "Disparador", "Puntos", "Estado", "Actualizado"]}
        rows={rules.map((rule) => [
          rule.name,
          rule.trigger,
          String(rule.pointsPerUnit),
          <StatusBadge
            key={`${rule.id}-status`}
            label={ruleStatusLabel(rule.status)}
            tone={rule.status === "active" ? "success" : "neutral"}
          />,
          formatDate(rule.updatedAt)
        ])}
      />

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-black/55">Cargando fidelización...</p> : null}
    </div>
  );
}
