import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, OnModuleInit, forwardRef } from "@nestjs/common";
import {
  CommissionPayoutStatus,
  CommissionStatus,
  OrderStatus,
  PaymentStatus,
  VendorCollaborationType,
  VendorStatus,
  type AdminOrderSummary,
  type CommissionPayoutInput,
  type CommissionPayoutSettleInput,
  type CommissionRuleInput,
  type CommissionPayoutSummary,
  type CommissionRuleSummary,
  type CommissionSummary,
  isOrderCommerciallySettled,
  isOrderStatusTerminalCancellation
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

function normalizeCollaborationType(value?: VendorCollaborationType | string) {
  return value === VendorCollaborationType.Affiliate ? VendorCollaborationType.Affiliate : value === VendorCollaborationType.Seller ? VendorCollaborationType.Seller : undefined;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeAmount(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return roundCurrency(value);
}

function normalizePaymentMethod(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === "any") {
    return "any";
  }

  if (normalized === "openpay" || normalized === "manual") {
    return normalized;
  }

  return undefined;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function addDays(iso: string, days: number) {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
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

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

function demoRuntimeEnabled() {
  const value = process.env.HUELEGOOD_ENABLE_DEMO_DATA?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

const demoOrderNumbers = new Set(["HG-10040", "HG-10041", "HG-10042"]);

@Injectable()
export class CommissionsService implements OnModuleInit {
  private readonly rules = new Map<string, CommissionRuleRecord>();

  private readonly commissions = new Map<string, CommissionRecord>();

  private readonly payouts = new Map<string, CommissionPayoutRecord>();

  constructor(
    private readonly auditService: AuditService,
    private readonly ordersService: OrdersService,
    @Inject(forwardRef(() => VendorsService)) private readonly vendorsService: VendorsService,
    private readonly moduleStateService: ModuleStateService,
    private readonly bullMqService: BullMqService
  ) {
    if (demoRuntimeEnabled()) {
      this.seedRules();
    }
  }

  async onModuleInit() {
    const snapshot = await this.moduleStateService.load<CommissionsSnapshot>("commissions");
    if (snapshot) {
      const sanitizedSnapshot = this.sanitizeSnapshot(snapshot);
      this.restoreSnapshot(sanitizedSnapshot ?? snapshot);
      if (sanitizedSnapshot) {
        await this.persistState();
      }
    }

    const changed = demoRuntimeEnabled() && this.ensureOperationalRules();
    if (!snapshot || changed) {
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
        paymentMethod: rule.paymentMethod,
        appliesToVendorCode: rule.appliesToVendorCode,
        appliesToCollaborationType: rule.appliesToCollaborationType,
        minOrderTotal: rule.minOrderTotal,
        maxOrderTotal: rule.maxOrderTotal,
        payoutDelayDays: rule.payoutDelayDays,
        notes: rule.notes,
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

  createRule(body: CommissionRuleInput) {
    const now = nowIso();
    const rule = this.buildRuleRecord(body, now);

    if (this.rules.has(rule.id)) {
      throw new ConflictException(`Ya existe una regla con id ${rule.id}.`);
    }

    this.rules.set(rule.id, rule);
    this.auditService.recordAdminAction({
      actionType: "commissions.rule.created",
      targetType: "commission_rule",
      targetId: rule.id,
      summary: `La regla ${rule.name} quedó creada.`,
      actorName: "commissions_admin",
      metadata: {
        scope: rule.scope,
        rate: rule.rate,
        priority: rule.priority,
        paymentMethod: rule.paymentMethod,
        appliesToVendorCode: rule.appliesToVendorCode,
        appliesToCollaborationType: rule.appliesToCollaborationType,
        payoutDelayDays: rule.payoutDelayDays
      }
    });
    void this.persistState();

    return actionResponse("ok", "La regla de comisión quedó creada.", rule.id);
  }

  updateRule(id: string, body: CommissionRuleInput) {
    const current = this.rules.get(id.trim());
    if (!current) {
      throw new NotFoundException(`No encontramos la regla ${id}.`);
    }

    const now = nowIso();
    const next = this.buildRuleRecord(
      {
        ...current,
        ...body
      },
      now,
      current.id,
      current.createdAt
    );

    this.rules.set(current.id, next);
    this.auditService.recordAdminAction({
      actionType: "commissions.rule.updated",
      targetType: "commission_rule",
      targetId: current.id,
      summary: `La regla ${next.name} quedó actualizada.`,
      actorName: "commissions_admin",
      metadata: {
        scope: next.scope,
        rate: next.rate,
        priority: next.priority,
        paymentMethod: next.paymentMethod,
        appliesToVendorCode: next.appliesToVendorCode,
        appliesToCollaborationType: next.appliesToCollaborationType,
        payoutDelayDays: next.payoutDelayDays,
        status: next.status
      }
    });
    void this.persistState();

    return actionResponse("ok", "La regla de comisión quedó actualizada.", current.id);
  }

  replaceVendorCodeReferences(oldCode: string, nextCode: string, actor = "admin") {
    const previousCode = normalizeCode(oldCode);
    const updatedCode = normalizeCode(nextCode);

    if (!previousCode || !updatedCode || previousCode === updatedCode) {
      return { rulesUpdated: 0 };
    }

    const now = nowIso();
    let rulesUpdated = 0;

    for (const rule of this.rules.values()) {
      if (rule.appliesToVendorCode !== previousCode) {
        continue;
      }

      rule.appliesToVendorCode = updatedCode;
      rule.updatedAt = now;
      rulesUpdated += 1;
    }

    if (rulesUpdated > 0) {
      this.auditService.recordAdminAction({
        actionType: "commissions.vendor_code_relinked",
        targetType: "commission_rule",
        targetId: previousCode,
        summary: `Se actualizaron ${rulesUpdated} regla(s) de comisión del código ${previousCode} a ${updatedCode}.`,
        actorName: actor,
        metadata: {
          previousCode,
          updatedCode,
          rulesUpdated
        }
      });
      void this.persistState();
    }

    return { rulesUpdated };
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
      bonusAmount: normalizeAmount(body.bonusAmount),
      bonusReason: normalizeText(body.bonusReason),
      deductionAmount: normalizeAmount(body.deductionAmount),
      deductionReason: normalizeText(body.deductionReason),
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
    const bonusAmount = normalizeAmount(body.bonusAmount);
    const deductionAmount = normalizeAmount(body.deductionAmount);
    const netAmount = roundCurrency(grossAmount + bonusAmount - deductionAmount);
    if (netAmount < 0) {
      throw new BadRequestException("La liquidación no puede quedar con monto neto negativo.");
    }
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
      bonusAmount,
      deductionAmount,
      netAmount,
      referenceId: normalizeText(body.referenceId),
      bonusReason: normalizeText(body.bonusReason),
      deductionReason: normalizeText(body.deductionReason),
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
        bonusAmount: payout.bonusAmount,
        deductionAmount: payout.deductionAmount,
        netAmount: payout.netAmount,
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
    const rule = this.resolveRule(order, vendor);
    if (!rule) {
      return;
    }

    const existing = this.commissions.get(commissionId);
    const period = periodFromIso(order.createdAt);
    const existingPayout = existing?.payoutId ? this.payouts.get(existing.payoutId) : undefined;
    const matchingPayout = this.findPayoutByVendorAndPeriod(vendorCode, period.key);
    const payout = existingPayout && existingPayout.status !== CommissionPayoutStatus.Cancelled ? existingPayout : matchingPayout;
    const eligibleAt = this.resolveEligibleAt(order, rule, existing?.eligibleAt);
    const nextStatus = this.resolveCommissionStatus(order, vendor, payout, eligibleAt, existing?.status);
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
      existing.vendorCode !== vendorCode ||
      existing.eligibleAt !== eligibleAt;

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
      ruleName: rule.name,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      payoutId: payout?.id,
      eligibleAt,
      createdAt: existing?.createdAt ?? order.createdAt,
      updatedAt: hasMeaningfulChanges ? occurredAt : existing?.updatedAt ?? occurredAt,
      ruleId: rule.id,
      blockedReason,
      statusHistory
    });
  }

  private resolveRule(order: AdminOrderSummary, vendor: ReturnType<VendorsService["findVendorByCode"]>): CommissionRuleRecord | undefined {
    const activeRules = Array.from(this.rules.values())
      .filter((rule) => rule.status === "active")
      .sort((left, right) => left.priority - right.priority);

    if (!activeRules.length) {
      if (isProductionRuntime()) {
        return undefined;
      }

      throw new BadRequestException("No hay reglas de comisión activas.");
    }

    const matchedRule = activeRules.find((rule) => this.ruleMatches(rule, order, vendor));
    if (!matchedRule) {
      if (isProductionRuntime()) {
        return undefined;
      }

      throw new BadRequestException("No encontramos una regla de comisión aplicable para ese pedido.");
    }

    return matchedRule;
  }

  private ruleMatches(
    rule: CommissionRuleRecord,
    order: AdminOrderSummary,
    vendor: ReturnType<VendorsService["findVendorByCode"]>
  ) {
    if (rule.appliesToVendorCode && rule.appliesToVendorCode !== normalizeCode(vendor?.code)) {
      return false;
    }

    if (rule.appliesToCollaborationType && rule.appliesToCollaborationType !== normalizeCollaborationType(vendor?.collaborationType)) {
      return false;
    }

    if (rule.paymentMethod && rule.paymentMethod !== "any" && rule.paymentMethod !== order.paymentMethod) {
      return false;
    }

    if (typeof rule.minOrderTotal === "number" && order.total < rule.minOrderTotal) {
      return false;
    }

    if (typeof rule.maxOrderTotal === "number" && order.total > rule.maxOrderTotal) {
      return false;
    }

    if (rule.scope === "wholesale" && normalizeCollaborationType(vendor?.collaborationType) !== "seller") {
      return false;
    }

    return true;
  }

  private resolveEligibleAt(order: AdminOrderSummary, rule: CommissionRuleRecord, previousEligibleAt?: string) {
    if (!isOrderCommerciallySettled(order)) {
      return previousEligibleAt;
    }

    const baseIso = order.updatedAt || order.createdAt;
    return addDays(baseIso, rule.payoutDelayDays);
  }

  private resolveCommissionStatus(
    order: AdminOrderSummary,
    vendor: ReturnType<VendorsService["findVendorByCode"]>,
    payout: CommissionPayoutRecord | null | undefined,
    eligibleAt: string | undefined,
    previousStatus?: CommissionStatus
  ) {
    if (!vendor || vendor.status !== VendorStatus.Active) {
      return CommissionStatus.Blocked;
    }

    const terminalCancellation = isOrderStatusTerminalCancellation(order.orderStatus) || order.paymentStatus === PaymentStatus.Failed;

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

    if (isOrderCommerciallySettled(order)) {
      if (eligibleAt && new Date(eligibleAt).getTime() > Date.now()) {
        return CommissionStatus.Approved;
      }

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
        return `${base} quedó aprobado y espera ventana de pago antes de pasar a pagable.`;
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
    const now = nowIso();
    const payoutsToDelete: string[] = [];

    for (const payout of this.payouts.values()) {
      const commissions = this.sortedCommissionRecords().filter((commission) => commission.payoutId === payout.id);
      if (!commissions.length) {
        payoutsToDelete.push(payout.id);
        continue;
      }

      payout.vendorName = commissions[0]?.vendorName ?? payout.vendorName;
      payout.vendorCode = commissions[0]?.vendorCode ?? payout.vendorCode;
      payout.vendorId = commissions[0]?.vendorId ?? payout.vendorId;
      payout.period = commissions[0]?.period ?? payout.period;
      payout.commissionIds = commissions.map((commission) => commission.id);
      payout.grossAmount = roundCurrency(commissions.reduce((sum, commission) => sum + commission.commissionAmount, 0));
      payout.bonusAmount = normalizeAmount(payout.bonusAmount);
      payout.deductionAmount = normalizeAmount(payout.deductionAmount);
      payout.netAmount = roundCurrency(payout.grossAmount + payout.bonusAmount - payout.deductionAmount);
      payout.updatedAt = now;
    }

    for (const payoutId of payoutsToDelete) {
      this.payouts.delete(payoutId);
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
      ruleName: commission.ruleName,
      orderStatus: commission.orderStatus,
      paymentStatus: commission.paymentStatus,
      payoutId: commission.payoutId,
      eligibleAt: commission.eligibleAt,
      blockedReason: commission.blockedReason,
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
      bonusAmount: payout.bonusAmount,
      deductionAmount: payout.deductionAmount,
      netAmount: payout.netAmount,
      referenceId: payout.referenceId,
      bonusReason: payout.bonusReason,
      deductionReason: payout.deductionReason,
      notes: payout.notes,
      createdAt: payout.createdAt,
      paidAt: payout.paidAt,
      updatedAt: payout.updatedAt
    };
  }

  private commissionId(orderNumber: string) {
    return `com-${orderNumber.trim().toLowerCase()}`;
  }

  private sanitizeSnapshot(snapshot: CommissionsSnapshot) {
    if (demoRuntimeEnabled()) {
      return undefined;
    }

    const demoRuleIds = new Set(this.defaultRules().map((rule) => rule.id));
    const rules = (snapshot.rules ?? []).filter((rule) => !demoRuleIds.has(rule.id));
    const commissions = (snapshot.commissions ?? []).filter(
      (commission) => !demoRuleIds.has(commission.ruleId) && !demoOrderNumbers.has(commission.orderNumber)
    );
    const commissionIds = new Set(commissions.map((commission) => commission.id));
    const now = nowIso();
    let payoutsChanged = false;
    const payouts: CommissionPayoutRecord[] = [];

    for (const payout of snapshot.payouts ?? []) {
      const relatedCommissions = (payout.commissionIds ?? []).filter((commissionId) => commissionIds.has(commissionId));
      if (!relatedCommissions.length) {
        payoutsChanged = true;
        continue;
      }

      const commissionRecords = relatedCommissions
        .map((commissionId) => commissions.find((commission) => commission.id === commissionId))
        .filter((commission): commission is CommissionRecord => Boolean(commission));
      if (!commissionRecords.length) {
        payoutsChanged = true;
        continue;
      }

      const grossAmount = roundCurrency(commissionRecords.reduce((sum, commission) => sum + commission.commissionAmount, 0));
      const bonusAmount = normalizeAmount(payout.bonusAmount);
      const deductionAmount = normalizeAmount(payout.deductionAmount);
      const netAmount = roundCurrency(grossAmount + bonusAmount - deductionAmount);
      const firstCommission = commissionRecords[0]!;
      const changed =
        relatedCommissions.length !== (payout.commissionIds ?? []).length ||
        payout.grossAmount !== grossAmount ||
        payout.netAmount !== netAmount ||
        payout.vendorCode !== firstCommission.vendorCode ||
        payout.vendorName !== firstCommission.vendorName ||
        payout.vendorId !== firstCommission.vendorId ||
        payout.period !== firstCommission.period;
      payoutsChanged = payoutsChanged || changed;

      payouts.push({
        ...payout,
        vendorName: firstCommission.vendorName,
        vendorCode: firstCommission.vendorCode,
        vendorId: firstCommission.vendorId,
        period: firstCommission.period,
        commissionIds: [...relatedCommissions],
        grossAmount,
        bonusAmount,
        deductionAmount,
        netAmount,
        updatedAt: changed ? now : payout.updatedAt,
        statusHistory: payout.statusHistory.map((entry) => ({ ...entry }))
      });
    }

    const hasChanges =
      rules.length !== (snapshot.rules ?? []).length ||
      commissions.length !== (snapshot.commissions ?? []).length ||
      payoutsChanged;

    if (!hasChanges) {
      return undefined;
    }

    return {
      rules: rules.map((rule) => ({ ...rule })),
      commissions: commissions.map((commission) => ({
        ...commission,
        statusHistory: commission.statusHistory.map((entry) => ({ ...entry }))
      })),
      payouts
    };
  }

  private buildRuleRecord(body: CommissionRuleInput, updatedAt: string, id?: string, createdAt?: string): CommissionRuleRecord {
    const name = normalizeText(body.name);
    const description = normalizeText(body.description);
    const scope = body.scope;
    const rate = typeof body.rate === "number" ? body.rate : Number.NaN;
    const priority = typeof body.priority === "number" ? body.priority : Number.NaN;

    if (!name || !description || !scope) {
      throw new BadRequestException("Nombre, descripción y alcance son obligatorios.");
    }

    if (!Number.isFinite(rate) || rate <= 0 || rate > 1) {
      throw new BadRequestException("La tasa de comisión debe estar entre 0 y 1.");
    }

    if (!Number.isFinite(priority)) {
      throw new BadRequestException("La prioridad de la regla es obligatoria.");
    }

    const paymentMethod = normalizePaymentMethod(body.paymentMethod);
    if (!paymentMethod) {
      throw new BadRequestException("El método de pago de la regla no es válido.");
    }

    const minOrderTotal = typeof body.minOrderTotal === "number" ? roundCurrency(body.minOrderTotal) : undefined;
    const maxOrderTotal = typeof body.maxOrderTotal === "number" ? roundCurrency(body.maxOrderTotal) : undefined;
    if (typeof minOrderTotal === "number" && typeof maxOrderTotal === "number" && minOrderTotal > maxOrderTotal) {
      throw new BadRequestException("El mínimo no puede ser mayor que el máximo de ticket.");
    }

    const payoutDelayDays =
      typeof body.payoutDelayDays === "number" && Number.isFinite(body.payoutDelayDays) ? Math.max(0, Math.round(body.payoutDelayDays)) : 0;

    const safeId =
      id ??
      `cr-${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")}`;

    return {
      id: safeId,
      name,
      description,
      scope,
      rate,
      paymentMethod,
      appliesToVendorCode: normalizeCode(body.appliesToVendorCode),
      appliesToCollaborationType: normalizeCollaborationType(body.appliesToCollaborationType),
      minOrderTotal,
      maxOrderTotal,
      payoutDelayDays,
      notes: normalizeText(body.notes),
      priority: Math.round(priority),
      status: body.status === "inactive" ? "inactive" : "active",
      createdAt: createdAt ?? updatedAt,
      updatedAt
    };
  }

  private ensureOperationalRules() {
    let changed = false;
    const seeds = this.defaultRules();

    for (const seed of seeds) {
      const normalized = this.buildRuleRecord(seed, seed.updatedAt, seed.id, seed.createdAt);
      const current = this.rules.get(seed.id);
      if (!current || JSON.stringify(current) !== JSON.stringify(normalized)) {
        this.rules.set(seed.id, normalized);
        changed = true;
      }
    }

    return changed;
  }

  private defaultRules(): CommissionRuleRecord[] {
    const createdAt = "2026-03-18T09:00:00.000Z";
    return [
      {
        id: "cr-vend014-premium-openpay",
        name: "Boost vendedor premium Openpay",
        description: "Aumenta la comisión del seller principal para tickets premium cobrados por Openpay.",
        scope: "vendor",
        rate: 0.18,
        paymentMethod: "openpay",
        appliesToVendorCode: "VEND-014",
        minOrderTotal: 300,
        maxOrderTotal: undefined,
        payoutDelayDays: 1,
        notes: "Regla de empuje comercial para ticket premium.",
        priority: 0,
        status: "active",
        createdAt,
        updatedAt: createdAt
      },
      {
        id: "cr-seller-code-openpay-base",
        name: "Comisión seller-first Openpay",
        description: "15% sobre pedidos atribuidos a un vendedor activo con código válido y pagados por Openpay.",
        scope: "seller_code",
        rate: 0.15,
        paymentMethod: "openpay",
        appliesToVendorCode: undefined,
        minOrderTotal: undefined,
        maxOrderTotal: undefined,
        payoutDelayDays: 2,
        notes: "Base para ventas online con confirmación Openpay.",
        priority: 1,
        status: "active",
        createdAt,
        updatedAt: createdAt
      },
      {
        id: "cr-seller-code-manual-base",
        name: "Comisión seller-first manual",
        description: "12% para pedidos atribuidos que requieren conciliación manual.",
        scope: "payment_method",
        rate: 0.12,
        paymentMethod: "manual",
        appliesToVendorCode: undefined,
        minOrderTotal: undefined,
        maxOrderTotal: undefined,
        payoutDelayDays: 5,
        notes: "Menor tasa y mayor espera por riesgo operativo.",
        priority: 2,
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
        paymentMethod: "any",
        appliesToVendorCode: undefined,
        minOrderTotal: 1000,
        maxOrderTotal: undefined,
        payoutDelayDays: 7,
        notes: "Reservada para convenios B2B y no aplica por defecto.",
        priority: 3,
        status: "inactive",
        createdAt,
        updatedAt: createdAt
      }
    ];
  }

  private seedRules() {
    const rules = this.defaultRules();

    for (const rule of rules) {
      this.rules.set(rule.id, rule);
    }
  }

  private restoreSnapshot(snapshot: CommissionsSnapshot) {
    this.rules.clear();
    this.commissions.clear();
    this.payouts.clear();

    for (const rule of snapshot.rules ?? []) {
      this.rules.set(
        rule.id,
        this.buildRuleRecord(
          {
            ...rule,
            payoutDelayDays: rule.payoutDelayDays ?? 0,
            paymentMethod: rule.paymentMethod ?? "any"
          },
          rule.updatedAt,
          rule.id,
          rule.createdAt
        )
      );
    }

    for (const commission of snapshot.commissions ?? []) {
      this.commissions.set(commission.id, {
        ...commission,
        ruleName: commission.ruleName,
        eligibleAt: commission.eligibleAt,
        blockedReason: commission.blockedReason,
        statusHistory: commission.statusHistory.map((entry) => ({ ...entry }))
      });
    }

    for (const payout of snapshot.payouts ?? []) {
      this.payouts.set(payout.id, {
        ...payout,
        bonusAmount: normalizeAmount(payout.bonusAmount),
        deductionAmount: normalizeAmount(payout.deductionAmount),
        bonusReason: normalizeText(payout.bonusReason),
        deductionReason: normalizeText(payout.deductionReason),
        netAmount: roundCurrency(
          normalizeAmount(payout.grossAmount) + normalizeAmount(payout.bonusAmount) - normalizeAmount(payout.deductionAmount)
        ),
        statusHistory: payout.statusHistory.map((entry) => ({ ...entry }))
      });
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
