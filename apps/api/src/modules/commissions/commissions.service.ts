import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import {
  CommissionPayoutStatus,
  CommissionStatus,
  OrderStatus,
  PaymentStatus,
  VendorStatus,
  type AdminOrderSummary,
  type CommissionPayoutInput,
  type CommissionPayoutSettleInput,
  type CommissionPayoutSummary,
  type CommissionRuleSummary,
  type CommissionSummary
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { BullMqService } from "../../persistence/bullmq.service";
import { AuditService } from "../audit/audit.service";
import { OrdersService } from "../orders/orders.service";
import { VendorsService } from "../vendors/vendors.service";
import { ModuleStateService } from "../../persistence/module-state.service";

interface CommissionHistoryEntry {
  status: CommissionStatus;
  actor: string;
  occurredAt: string;
  note: string;
}

interface PayoutHistoryEntry {
  status: CommissionPayoutStatus;
  actor: string;
  occurredAt: string;
  note: string;
}

interface CommissionRuleRecord extends CommissionRuleSummary {
  createdAt: string;
  updatedAt: string;
}

interface CommissionRecord extends CommissionSummary {
  vendorId?: string;
  ruleId: string;
  ruleName: string;
  periodKey: string;
  blockedReason?: string;
  statusHistory: CommissionHistoryEntry[];
}

interface CommissionPayoutRecord extends CommissionPayoutSummary {
  vendorId?: string;
  periodKey: string;
  statusHistory: PayoutHistoryEntry[];
}

interface PeriodDescriptor {
  key: string;
  label: string;
}

interface CommissionsSnapshot {
  rules: CommissionRuleRecord[];
  commissions: CommissionRecord[];
  payouts: CommissionPayoutRecord[];
}

const commissionStatusLabels: Record<CommissionStatus, string> = {
  [CommissionStatus.PendingAttribution]: "Pendiente de atribución",
  [CommissionStatus.Attributed]: "Atribuida",
  [CommissionStatus.Approved]: "Aprobada",
  [CommissionStatus.Blocked]: "Bloqueada",
  [CommissionStatus.Payable]: "Pagable",
  [CommissionStatus.ScheduledForPayout]: "Programada para pago",
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

function nowIso() {
  return new Date().toISOString();
}

function normalizeCode(value?: string) {
  return value?.trim().toUpperCase() || undefined;
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function periodFromDate(date: Date): PeriodDescriptor {
  const key = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "UTC"
  }).format(date);
  const month = new Intl.DateTimeFormat("es-MX", {
    month: "long",
    timeZone: "UTC"
  }).format(date);
  const year = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone: "UTC"
  }).format(date);

  return {
    key,
    label: `${capitalize(month)} ${year}`
  };
}

function periodFromIso(iso: string): PeriodDescriptor {
  return periodFromDate(new Date(iso));
}

function resolvePeriod(value?: string): PeriodDescriptor {
  const normalized = normalizeText(value);
  if (!normalized) {
    return periodFromDate(new Date());
  }

  if (/^\d{4}-\d{2}$/.test(normalized)) {
    const [year, month] = normalized.split("-").map(Number);
    return periodFromDate(new Date(Date.UTC(year, month - 1, 1)));
  }

  return {
    key: normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || periodFromDate(new Date()).key,
    label: capitalize(normalized)
  };
}

function buildHistoryEntry(status: CommissionStatus, actor: string, note: string, occurredAt: string): CommissionHistoryEntry {
  return {
    status,
    actor,
    note,
    occurredAt
  };
}

function buildPayoutHistoryEntry(
  status: CommissionPayoutStatus,
  actor: string,
  note: string,
  occurredAt: string
): PayoutHistoryEntry {
  return {
    status,
    actor,
    note,
    occurredAt
  };
}

function summarizeCommissionStatuses(commissions: CommissionRecord[]) {
  return {
    pendingAttribution: commissions.filter((commission) => commission.status === CommissionStatus.PendingAttribution).length,
    attributed: commissions.filter((commission) => commission.status === CommissionStatus.Attributed).length,
    approved: commissions.filter((commission) => commission.status === CommissionStatus.Approved).length,
    blocked: commissions.filter((commission) => commission.status === CommissionStatus.Blocked).length,
    payable: commissions.filter((commission) => commission.status === CommissionStatus.Payable).length,
    scheduledForPayout: commissions.filter((commission) => commission.status === CommissionStatus.ScheduledForPayout).length,
    paid: commissions.filter((commission) => commission.status === CommissionStatus.Paid).length,
    reversed: commissions.filter((commission) => commission.status === CommissionStatus.Reversed).length,
    cancelled: commissions.filter((commission) => commission.status === CommissionStatus.Cancelled).length
  };
}

@Injectable()
export class CommissionsService implements OnModuleInit {
  private readonly rules = new Map<string, CommissionRuleRecord>();

  private readonly commissions = new Map<string, CommissionRecord>();

  private readonly payouts = new Map<string, CommissionPayoutRecord>();

  constructor(
    private readonly auditService: AuditService,
    private readonly ordersService: OrdersService,
    private readonly vendorsService: VendorsService,
    private readonly moduleStateService: ModuleStateService,
    private readonly bullMqService: BullMqService
  ) {
    this.seedRules();
  }

  async onModuleInit() {
    const snapshot = await this.moduleStateService.load<CommissionsSnapshot>("commissions");
    if (snapshot) {
      this.restoreSnapshot(snapshot);
    } else {
      await this.persistState();
    }
  }

  syncFromOrders(actor = "sistema") {
    const now = nowIso();
    const orders = this.ordersService.listOrders().data;

    for (const order of orders) {
      this.syncOrderCommission(order, actor, now);
    }

    this.reconcilePayouts();
    this.updateVendorSnapshots();
    if (actor !== "consulta") {
      this.auditService.recordAudit({
        module: "commissions",
        action: "sync_from_orders",
        entityType: "commission",
        entityId: "sync",
        summary: `Comisiones sincronizadas desde pedidos por ${actor}.`,
        actorName: actor,
        payload: {
          commissions: this.commissions.size,
          payouts: this.payouts.size
        }
      });
      void this.persistState();
    }

    return wrapResponse(
      {
        commissions: this.commissions.size,
        payouts: this.payouts.size,
        vendorsUpdated: this.vendorsService.listVendors().data.length
      },
      { syncedAt: now }
    );
  }

  listCommissions() {
    this.syncFromOrders("consulta");

    const commissions = this.sortedCommissions().map((commission) => this.toCommissionSummary(commission));
    return wrapResponse(commissions, {
      total: commissions.length,
      ...summarizeCommissionStatuses(this.sortedCommissionRecords())
    });
  }

  listCommissionsByVendorCode(vendorCode: string) {
    this.syncFromOrders("consulta");

    const normalizedVendorCode = normalizeCode(vendorCode);
    const commissions = this.sortedCommissions()
      .filter((commission) => commission.vendorCode === normalizedVendorCode)
      .map((commission) => this.toCommissionSummary(commission));

    return wrapResponse(commissions, {
      total: commissions.length,
      ...summarizeCommissionStatuses(
        this.sortedCommissionRecords().filter((commission) => commission.vendorCode === normalizedVendorCode)
      )
    });
  }

  listRules() {
    const rules = Array.from(this.rules.values()).sort((left, right) => left.priority - right.priority);
    return wrapResponse<CommissionRuleSummary[]>(
      rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        scope: rule.scope,
        rate: rule.rate,
        priority: rule.priority,
        status: rule.status
      })),
      {
        total: rules.length,
        active: rules.filter((rule) => rule.status === "active").length,
        inactive: rules.filter((rule) => rule.status === "inactive").length
      }
    );
  }

  listPayouts() {
    this.syncFromOrders("consulta");

    const payouts = this.sortedPayouts().map((payout) => this.toPayoutSummary(payout));
    return wrapResponse(payouts, {
      total: payouts.length,
      approved: payouts.filter((payout) => payout.status === CommissionPayoutStatus.Approved).length,
      paid: payouts.filter((payout) => payout.status === CommissionPayoutStatus.Paid).length,
      cancelled: payouts.filter((payout) => payout.status === CommissionPayoutStatus.Cancelled).length
    });
  }

  listPayoutsByVendorCode(vendorCode: string) {
    this.syncFromOrders("consulta");

    const normalizedVendorCode = normalizeCode(vendorCode);
    const payouts = this.sortedPayouts()
      .filter((payout) => payout.vendorCode === normalizedVendorCode)
      .map((payout) => this.toPayoutSummary(payout));

    return wrapResponse(payouts, {
      total: payouts.length,
      approved: payouts.filter((payout) => payout.status === CommissionPayoutStatus.Approved).length,
      paid: payouts.filter((payout) => payout.status === CommissionPayoutStatus.Paid).length,
      cancelled: payouts.filter((payout) => payout.status === CommissionPayoutStatus.Cancelled).length
    });
  }

  async queueCreatePayout(body: CommissionPayoutInput) {
    const vendorCode = normalizeCode(body.vendorCode);
    if (!vendorCode) {
      throw new BadRequestException("El código de vendedor es obligatorio para crear una liquidación.");
    }

    const job = await this.bullMqService.enqueueCommissionPayoutCreate({
      vendorCode,
      period: normalizeText(body.period),
      referenceId: normalizeText(body.referenceId),
      notes: normalizeText(body.notes),
      requestedAt: nowIso()
    });

    if (job) {
      return actionResponse("queued", "La liquidación quedó en cola para preparación.", vendorCode);
    }

    return this.createPayout(body);
  }

  async queueSettlePayout(id: string, body: CommissionPayoutSettleInput) {
    this.requirePayout(id);

    const job = await this.bullMqService.enqueueCommissionPayoutSettle({
      payoutId: id.trim(),
      reviewer: normalizeText(body.reviewer),
      notes: normalizeText(body.notes),
      referenceId: normalizeText(body.referenceId),
      requestedAt: nowIso()
    });

    if (job) {
      return actionResponse("queued", "La liquidación quedó en cola para conciliación final.", id);
    }

    return this.settlePayout(id, body);
  }

  createPayout(body: CommissionPayoutInput) {
    this.syncFromOrders("liquidacion");

    const vendorCode = normalizeCode(body.vendorCode);
    if (!vendorCode) {
      throw new BadRequestException("El código de vendedor es obligatorio para crear una liquidación.");
    }

    const vendor = this.vendorsService.findVendorByCode(vendorCode);
    if (!vendor) {
      throw new NotFoundException(`No encontramos un vendedor con el código ${vendorCode}.`);
    }

    const period = resolvePeriod(body.period);
    const activePayout = this.findPayoutByVendorAndPeriod(vendorCode, period.key);
    if (activePayout && activePayout.status !== CommissionPayoutStatus.Cancelled) {
      throw new ConflictException("Ya existe una liquidación activa para ese vendedor y periodo.");
    }

    const eligibleCommissions = this.sortedCommissionRecords().filter(
      (commission) =>
        commission.vendorCode === vendorCode &&
        commission.periodKey === period.key &&
        commission.status === CommissionStatus.Payable
    );

    if (!eligibleCommissions.length) {
      throw new BadRequestException("No hay comisiones pagables para liquidar en ese periodo.");
    }

    const createdAt = nowIso();
    const payoutId = `cp-${vendorCode.toLowerCase()}-${period.key}`;
    const grossAmount = roundCurrency(eligibleCommissions.reduce((sum, commission) => sum + commission.commissionAmount, 0));
    const payout: CommissionPayoutRecord = {
      id: payoutId,
      vendorName: vendor.name,
      vendorCode,
      vendorId: vendor.id,
      period: period.label,
      periodKey: period.key,
      status: CommissionPayoutStatus.Approved,
      commissionIds: eligibleCommissions.map((commission) => commission.id),
      grossAmount,
      netAmount: grossAmount,
      referenceId: normalizeText(body.referenceId),
      notes: normalizeText(body.notes),
      createdAt,
      updatedAt: createdAt,
      paidAt: undefined,
      statusHistory: [
        buildPayoutHistoryEntry(
          CommissionPayoutStatus.Approved,
          "administrador",
          "La liquidación fue preparada para pago.",
          createdAt
        )
      ]
    };

    this.payouts.set(payout.id, payout);

    for (const commission of eligibleCommissions) {
      commission.payoutId = payout.id;
      commission.status = CommissionStatus.ScheduledForPayout;
      commission.updatedAt = createdAt;
      commission.statusHistory = [
        ...commission.statusHistory,
        buildHistoryEntry(
          CommissionStatus.ScheduledForPayout,
          "administrador",
          `Se programó para la liquidación ${payout.id}.`,
          createdAt
        )
      ];
    }

    this.reconcilePayouts();
    this.updateVendorSnapshots();
    this.auditService.recordAdminAction({
      actionType: "commissions.payout.created",
      targetType: "commission_payout",
      targetId: payout.id,
      summary: `La liquidación ${payout.id} quedó preparada para ${vendorCode}.`,
      actorName: "liquidacion",
      metadata: {
        vendorCode,
        period: period.key,
        grossAmount: payout.grossAmount,
        commissionIds: payout.commissionIds.length
      }
    });

    void this.persistState();

    return {
      ...actionResponse("queued", "La liquidación quedó preparada para pago.", payout.id),
      payout: this.toPayoutSummary(payout)
    };
  }

  settlePayout(id: string, body: CommissionPayoutSettleInput) {
    this.syncFromOrders("liquidacion");

    const payout = this.requirePayout(id);
    if (payout.status === CommissionPayoutStatus.Paid) {
      return {
        ...actionResponse("ok", "La liquidación ya estaba pagada.", id),
        payout: this.toPayoutSummary(payout)
      };
    }

    if (payout.status === CommissionPayoutStatus.Cancelled) {
      throw new BadRequestException("No se puede pagar una liquidación cancelada.");
    }

    const now = nowIso();
    const reviewer = normalizeText(body.reviewer) || "operador_pagos";
    const notes = normalizeText(body.notes) || "Liquidación pagada y conciliada.";

    payout.status = CommissionPayoutStatus.Paid;
    payout.referenceId = normalizeText(body.referenceId) || payout.referenceId;
    payout.notes = notes;
    payout.updatedAt = now;
    payout.paidAt = payout.paidAt ?? now;
    payout.statusHistory = [
      ...payout.statusHistory,
      buildPayoutHistoryEntry(CommissionPayoutStatus.Paid, reviewer, notes, now)
    ];

    for (const commission of this.commissions.values()) {
      if (commission.payoutId !== payout.id) {
        continue;
      }

      commission.status = CommissionStatus.Paid;
      commission.updatedAt = now;
      commission.statusHistory = [
        ...commission.statusHistory,
        buildHistoryEntry(CommissionStatus.Paid, reviewer, "La comisión quedó pagada.", now)
      ];
    }

    this.reconcilePayouts();
    this.updateVendorSnapshots();
    this.auditService.recordAdminAction({
      actionType: "commissions.payout.settled",
      targetType: "commission_payout",
      targetId: payout.id,
      summary: `La liquidación ${payout.id} quedó pagada.`,
      actorName: reviewer,
      metadata: {
        vendorCode: payout.vendorCode,
        notes,
        referenceId: payout.referenceId
      }
    });

    void this.persistState();

    return {
      ...actionResponse("ok", "La liquidación quedó pagada y conciliada.", id),
      payout: this.toPayoutSummary(payout)
    };
  }

  ensurePayoutForJob(body: CommissionPayoutInput) {
    try {
      return this.createPayout(body);
    } catch (error) {
      if (error instanceof ConflictException) {
        const vendorCode = normalizeCode(body.vendorCode);
        if (!vendorCode) {
          throw error;
        }

        const period = resolvePeriod(body.period);
        const payout = this.findPayoutByVendorAndPeriod(vendorCode, period.key);
        if (payout && payout.status !== CommissionPayoutStatus.Cancelled) {
          return {
            ...actionResponse("ok", "La liquidación ya estaba preparada.", payout.id),
            payout: this.toPayoutSummary(payout)
          };
        }
      }

      throw error;
    }
  }

  private syncOrderCommission(order: AdminOrderSummary, actor: string, occurredAt: string) {
    const commissionId = this.commissionId(order.orderNumber);
    const vendorCode = normalizeCode(order.vendorCode);
    if (!vendorCode) {
      return;
    }

    const vendor = this.vendorsService.findVendorByCode(vendorCode);
    const rule = this.resolveRule(vendor);
    const existing = this.commissions.get(commissionId);
    const period = periodFromIso(order.createdAt);
    const existingPayout = existing?.payoutId ? this.payouts.get(existing.payoutId) : undefined;
    const matchingPayout = this.findPayoutByVendorAndPeriod(vendorCode, period.key);
    const payout = existingPayout && existingPayout.status !== CommissionPayoutStatus.Cancelled ? existingPayout : matchingPayout;
    const nextStatus = this.resolveCommissionStatus(order, vendor, payout, existing?.status);
    const commissionAmount = roundCurrency(order.total * rule.rate);
    const statusChanged = !existing || existing.status !== nextStatus;
    const hasMeaningfulChanges =
      !existing ||
      existing.orderTotal !== order.total ||
      existing.commissionAmount !== commissionAmount ||
      existing.orderStatus !== order.orderStatus ||
      existing.paymentStatus !== order.paymentStatus ||
      existing.payoutId !== payout?.id ||
      existing.ruleId !== rule.id ||
      existing.vendorCode !== vendorCode;

    const statusHistory = existing?.statusHistory ?? [
      buildHistoryEntry(
        nextStatus,
        actor,
        this.buildStatusNote(nextStatus, order, vendor, payout),
        occurredAt
      )
    ];

    if (existing && statusChanged) {
      statusHistory.push(
        buildHistoryEntry(
          nextStatus,
          actor,
          this.buildStatusNote(nextStatus, order, vendor, payout),
          occurredAt
        )
      );
    }

    const blockedReason = this.resolveBlockedReason(order, vendor, nextStatus);

    this.commissions.set(commissionId, {
      id: commissionId,
      orderNumber: order.orderNumber,
      vendorName: vendor?.name ?? existing?.vendorName ?? `Código ${vendorCode}`,
      vendorCode,
      vendorId: vendor?.id ?? existing?.vendorId,
      orderTotal: order.total,
      commissionRate: rule.rate,
      commissionAmount,
      status: nextStatus,
      period: existing?.period ?? period.label,
      periodKey: period.key,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      payoutId: payout?.id,
      createdAt: existing?.createdAt ?? order.createdAt,
      updatedAt: hasMeaningfulChanges ? occurredAt : existing?.updatedAt ?? occurredAt,
      ruleId: rule.id,
      ruleName: rule.name,
      blockedReason,
      statusHistory
    });
  }

  private resolveRule(vendor: ReturnType<VendorsService["findVendorByCode"]>) {
    const activeRules = Array.from(this.rules.values())
      .filter((rule) => rule.status === "active")
      .sort((left, right) => left.priority - right.priority);

    if (!activeRules.length) {
      throw new BadRequestException("No hay reglas de comisión activas.");
    }

    return activeRules[0];
  }

  private resolveCommissionStatus(
    order: AdminOrderSummary,
    vendor: ReturnType<VendorsService["findVendorByCode"]>,
    payout: CommissionPayoutRecord | null | undefined,
    previousStatus?: CommissionStatus
  ) {
    if (!vendor || vendor.status !== VendorStatus.Active) {
      return CommissionStatus.Blocked;
    }

    const terminalCancellation =
      order.orderStatus === OrderStatus.Cancelled ||
      order.orderStatus === OrderStatus.Refunded ||
      order.orderStatus === OrderStatus.Expired ||
      order.paymentStatus === PaymentStatus.Failed;

    if (terminalCancellation) {
      return previousStatus === CommissionStatus.Paid || payout?.status === CommissionPayoutStatus.Paid
        ? CommissionStatus.Reversed
        : CommissionStatus.Cancelled;
    }

    if (payout?.status === CommissionPayoutStatus.Paid) {
      return CommissionStatus.Paid;
    }

    if (payout?.status === CommissionPayoutStatus.Approved || payout?.status === CommissionPayoutStatus.Draft) {
      return CommissionStatus.ScheduledForPayout;
    }

    if (order.paymentStatus === PaymentStatus.Paid || order.orderStatus === OrderStatus.Paid || order.orderStatus === OrderStatus.Confirmed) {
      return CommissionStatus.Payable;
    }

    if (order.paymentStatus === PaymentStatus.Authorized || order.orderStatus === OrderStatus.PaymentUnderReview) {
      return CommissionStatus.Attributed;
    }

    return CommissionStatus.PendingAttribution;
  }

  private resolveBlockedReason(
    order: AdminOrderSummary,
    vendor: ReturnType<VendorsService["findVendorByCode"]>,
    status: CommissionStatus
  ) {
    if (status !== CommissionStatus.Blocked) {
      return undefined;
    }

    if (!vendor) {
      return `No encontramos el vendedor ${order.vendorCode ?? ""}`.trim();
    }

    return "El vendedor no está activo.";
  }

  private buildStatusNote(
    status: CommissionStatus,
    order: AdminOrderSummary,
    vendor: ReturnType<VendorsService["findVendorByCode"]>,
    payout: CommissionPayoutRecord | null | undefined
  ) {
    const base = `Pedido ${order.orderNumber}`;

    switch (status) {
      case CommissionStatus.PendingAttribution:
        return `${base} quedó pendiente de atribución comercial.`;
      case CommissionStatus.Attributed:
        return `${base} ya quedó atribuido al vendedor ${vendor?.code ?? order.vendorCode ?? "sin código"}.`;
      case CommissionStatus.Approved:
        return `${base} fue aprobado para seguimiento comercial.`;
      case CommissionStatus.Blocked:
        return `${base} quedó bloqueado por reglas comerciales.`;
      case CommissionStatus.Payable:
        return `${base} ya puede liquidarse.`;
      case CommissionStatus.ScheduledForPayout:
        return `${base} se asignó a la liquidación ${payout?.id ?? "pendiente"}.`;
      case CommissionStatus.Paid:
        return `${base} quedó pagado en la liquidación ${payout?.id ?? "pendiente"}.`;
      case CommissionStatus.Reversed:
        return `${base} se revirtió por una cancelación posterior.`;
      case CommissionStatus.Cancelled:
        return `${base} fue cancelado antes de consolidar comisión.`;
      default:
        return `${base} actualizó su estado comercial.`;
    }
  }

  private reconcilePayouts() {
    for (const payout of this.payouts.values()) {
      const commissions = this.sortedCommissionRecords().filter((commission) => commission.payoutId === payout.id);
      payout.vendorName = commissions[0]?.vendorName ?? payout.vendorName;
      payout.vendorCode = commissions[0]?.vendorCode ?? payout.vendorCode;
      payout.vendorId = commissions[0]?.vendorId ?? payout.vendorId;
      payout.period = commissions[0]?.period ?? payout.period;
      payout.commissionIds = commissions.map((commission) => commission.id);
      payout.grossAmount = roundCurrency(commissions.reduce((sum, commission) => sum + commission.commissionAmount, 0));
      payout.netAmount = payout.grossAmount;
      payout.updatedAt = nowIso();
    }
  }

  private updateVendorSnapshots() {
    const vendorSummaries = this.vendorsService.listVendors().data;

    for (const vendor of vendorSummaries) {
      const commissions = this.sortedCommissionRecords().filter((commission) => commission.vendorCode === vendor.code);
      const sales = roundCurrency(
          commissions.filter(
            (commission) =>
              commission.status === CommissionStatus.Paid ||
              commission.status === CommissionStatus.Payable ||
              commission.status === CommissionStatus.ScheduledForPayout
          )
          .reduce((sum, commission) => sum + commission.orderTotal, 0)
      );
      const commissionsTotal = roundCurrency(
        commissions.filter((commission) =>
          commission.status !== CommissionStatus.Blocked &&
          commission.status !== CommissionStatus.Cancelled &&
          commission.status !== CommissionStatus.Reversed
        ).reduce((sum, commission) => sum + commission.commissionAmount, 0)
      );
      const paidCommissions = roundCurrency(
        commissions
          .filter((commission) => commission.status === CommissionStatus.Paid)
          .reduce((sum, commission) => sum + commission.commissionAmount, 0)
      );
      const pendingCommissions = roundCurrency(
        commissions
          .filter((commission) =>
            commission.status === CommissionStatus.PendingAttribution ||
            commission.status === CommissionStatus.Attributed ||
            commission.status === CommissionStatus.Approved ||
            commission.status === CommissionStatus.Payable ||
            commission.status === CommissionStatus.ScheduledForPayout
          )
          .reduce((sum, commission) => sum + commission.commissionAmount, 0)
      );

      this.vendorsService.applyFinancialSnapshot(vendor.code, {
        sales,
        commissions: commissionsTotal,
        pendingCommissions,
        paidCommissions,
        ordersCount: commissions.length
      });
    }
  }

  private findPayoutByVendorAndPeriod(vendorCode: string, periodKey: string) {
    return Array.from(this.payouts.values()).find(
      (payout) => payout.vendorCode === vendorCode && payout.periodKey === periodKey && payout.status !== CommissionPayoutStatus.Cancelled
    );
  }

  private requirePayout(id: string) {
    const payout = this.payouts.get(id.trim());
    if (!payout) {
      throw new NotFoundException(`No encontramos la liquidación ${id}.`);
    }

    return payout;
  }

  private sortedCommissionRecords() {
    return Array.from(this.commissions.values()).sort((left, right) => {
      const delta = new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      if (delta !== 0) {
        return delta;
      }

      return right.orderNumber.localeCompare(left.orderNumber);
    });
  }

  private sortedCommissions() {
    return this.sortedCommissionRecords();
  }

  private sortedPayouts() {
    return Array.from(this.payouts.values()).sort((left, right) => {
      const delta = new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      if (delta !== 0) {
        return delta;
      }

      return right.id.localeCompare(left.id);
    });
  }

  private toCommissionSummary(commission: CommissionRecord): CommissionSummary {
    return {
      id: commission.id,
      orderNumber: commission.orderNumber,
      vendorName: commission.vendorName,
      vendorCode: commission.vendorCode,
      orderTotal: commission.orderTotal,
      commissionRate: commission.commissionRate,
      commissionAmount: commission.commissionAmount,
      status: commission.status,
      period: commission.period,
      orderStatus: commission.orderStatus,
      paymentStatus: commission.paymentStatus,
      payoutId: commission.payoutId,
      createdAt: commission.createdAt,
      updatedAt: commission.updatedAt
    };
  }

  private toPayoutSummary(payout: CommissionPayoutRecord): CommissionPayoutSummary {
    return {
      id: payout.id,
      vendorName: payout.vendorName,
      vendorCode: payout.vendorCode,
      period: payout.period,
      status: payout.status,
      commissionIds: payout.commissionIds,
      grossAmount: payout.grossAmount,
      netAmount: payout.netAmount,
      referenceId: payout.referenceId,
      notes: payout.notes,
      createdAt: payout.createdAt,
      paidAt: payout.paidAt,
      updatedAt: payout.updatedAt
    };
  }

  private commissionId(orderNumber: string) {
    return `com-${orderNumber.trim().toLowerCase()}`;
  }

  private seedRules() {
    const createdAt = "2026-03-18T09:00:00.000Z";
    const rules: CommissionRuleRecord[] = [
      {
        id: "cr-seller-code-base",
        name: "Comisión seller-first",
        description: "15% sobre pedidos atribuidos a un vendedor activo con código válido.",
        scope: "seller_code",
        rate: 0.15,
        priority: 1,
        status: "active",
        createdAt,
        updatedAt: createdAt
      },
      {
        id: "cr-wholesale-special",
        name: "Liquidación mayorista especial",
        description: "Regla reservada para acuerdos de volumen y distribuidores.",
        scope: "wholesale",
        rate: 0.1,
        priority: 2,
        status: "inactive",
        createdAt,
        updatedAt: createdAt
      }
    ];

    for (const rule of rules) {
      this.rules.set(rule.id, rule);
    }
  }

  private restoreSnapshot(snapshot: CommissionsSnapshot) {
    this.rules.clear();
    this.commissions.clear();
    this.payouts.clear();

    for (const rule of snapshot.rules ?? []) {
      this.rules.set(rule.id, rule);
    }

    for (const commission of snapshot.commissions ?? []) {
      this.commissions.set(commission.id, commission);
    }

    for (const payout of snapshot.payouts ?? []) {
      this.payouts.set(payout.id, payout);
    }
  }

  private async persistState() {
    await this.moduleStateService.save<CommissionsSnapshot>("commissions", this.buildSnapshot());
  }

  private buildSnapshot(): CommissionsSnapshot {
    return {
      rules: Array.from(this.rules.values()).map((rule) => ({ ...rule })),
      commissions: Array.from(this.commissions.values()).map((commission) => ({
        ...commission,
        statusHistory: commission.statusHistory.map((entry) => ({ ...entry }))
      })),
      payouts: Array.from(this.payouts.values()).map((payout) => ({
        ...payout,
        commissionIds: [...payout.commissionIds],
        statusHistory: payout.statusHistory.map((entry) => ({ ...entry }))
      }))
    };
  }
}
