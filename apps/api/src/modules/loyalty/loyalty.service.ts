import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import {
  LoyaltyMovementStatus,
  NotificationChannel,
  NotificationStatus,
  RedemptionStatus,
  type LoyaltyAccountSummary,
  type LoyaltyMovementSummary,
  type LoyaltyPointsInput,
  type LoyaltyRedemptionInput,
  type LoyaltyRedemptionStatusInput,
  type LoyaltyRedemptionSummary,
  type LoyaltyRuleSummary
} from "@huelegood/shared";
import { loyaltyOverview } from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ModuleStateService } from "../../persistence/module-state.service";

interface LoyaltyAccountRecord extends LoyaltyAccountSummary {
  id: string;
  email?: string;
  updatedAt: string;
}

interface LoyaltyMovementRecord extends LoyaltyMovementSummary {
  source: string;
}

interface LoyaltyRedemptionRecord extends LoyaltyRedemptionSummary {
  pointsReserved: number;
}

interface LoyaltyRuleRecord extends LoyaltyRuleSummary {}

interface LoyaltySnapshot {
  accounts: LoyaltyAccountRecord[];
  movements: LoyaltyMovementRecord[];
  redemptions: LoyaltyRedemptionRecord[];
  rules: LoyaltyRuleRecord[];
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeCustomer(value?: string) {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized ? normalized : undefined;
}

function normalizeStatus(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (Object.values(LoyaltyMovementStatus).includes(normalized as LoyaltyMovementStatus)) {
    return normalized as LoyaltyMovementStatus;
  }

  return undefined;
}

function normalizeRedemptionStatus(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (Object.values(RedemptionStatus).includes(normalized as RedemptionStatus)) {
    return normalized as RedemptionStatus;
  }

  return undefined;
}

function normalizeKind(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (["earn", "redeem", "adjustment", "bonus"].includes(normalized)) {
    return normalized as LoyaltyPointsInput["kind"];
  }

  return undefined;
}

@Injectable()
export class LoyaltyService implements OnModuleInit {
  private readonly accounts = new Map<string, LoyaltyAccountRecord>();

  private readonly movements = new Map<string, LoyaltyMovementRecord>();

  private readonly redemptions = new Map<string, LoyaltyRedemptionRecord>();

  private readonly rules = new Map<string, LoyaltyRuleRecord>();

  private movementSequence = 5;

  private redemptionSequence = 3;

  private ruleSequence = 4;

  constructor(
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly moduleStateService: ModuleStateService
  ) {
    this.seedData();
  }

  async onModuleInit() {
    const snapshot = await this.moduleStateService.load<LoyaltySnapshot>("loyalty");
    if (snapshot) {
      this.restoreSnapshot(snapshot);
    } else {
      await this.persistState();
    }
  }

  getSummary() {
    const account = this.getPrimaryAccount();
    return wrapResponse<LoyaltyAccountSummary | null>(account ? this.toSummary(account) : null, {
      totalAccounts: this.accounts.size,
      availablePoints: this.totalAvailablePoints(),
      pendingPoints: this.totalPendingPoints(),
      redeemedPoints: this.totalRedeemedPoints()
    });
  }

  listAccounts() {
    const accounts = Array.from(this.accounts.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return wrapResponse<LoyaltyAccountSummary[]>(
      accounts.map((account) => this.toSummary(account)),
      {
        total: accounts.length,
        active: accounts.filter((account) => account.availablePoints > 0).length,
        pending: accounts.filter((account) => account.pendingPoints > 0).length
      }
    );
  }

  listMovements() {
    const movements = Array.from(this.movements.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return wrapResponse<LoyaltyMovementSummary[]>(
      movements.map((movement) => ({
        id: movement.id,
        customer: movement.customer,
        orderNumber: movement.orderNumber,
        kind: movement.kind,
        points: movement.points,
        balanceAfter: movement.balanceAfter,
        status: movement.status,
        reason: movement.reason,
        reviewer: movement.reviewer,
        createdAt: movement.createdAt,
        updatedAt: movement.updatedAt
      })),
      {
        total: movements.length,
        pending: movements.filter((movement) => movement.status === LoyaltyMovementStatus.Pending).length,
        available: movements.filter((movement) => movement.status === LoyaltyMovementStatus.Available).length,
        reversed: movements.filter((movement) => movement.status === LoyaltyMovementStatus.Reversed).length,
        expired: movements.filter((movement) => movement.status === LoyaltyMovementStatus.Expired).length
      }
    );
  }

  listRedemptions() {
    const redemptions = Array.from(this.redemptions.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return wrapResponse<LoyaltyRedemptionSummary[]>(
      redemptions.map((redemption) => ({
        id: redemption.id,
        customer: redemption.customer,
        reward: redemption.reward,
        points: redemption.points,
        status: redemption.status,
        notes: redemption.notes,
        reviewer: redemption.reviewer,
        reviewedAt: redemption.reviewedAt,
        createdAt: redemption.createdAt,
        updatedAt: redemption.updatedAt
      })),
      {
        total: redemptions.length,
        pending: redemptions.filter((redemption) => redemption.status === RedemptionStatus.Pending).length,
        applied: redemptions.filter((redemption) => redemption.status === RedemptionStatus.Applied).length,
        cancelled: redemptions.filter((redemption) => redemption.status === RedemptionStatus.Cancelled).length
      }
    );
  }

  listRules() {
    const rules = Array.from(this.rules.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return wrapResponse<LoyaltyRuleSummary[]>(
      rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        trigger: rule.trigger,
        pointsPerUnit: rule.pointsPerUnit,
        status: rule.status,
        updatedAt: rule.updatedAt
      })),
      {
        total: rules.length,
        active: rules.filter((rule) => rule.status === "active").length
      }
    );
  }

  assignPoints(body: LoyaltyPointsInput) {
    const customer = normalizeCustomer(body.customer);
    const reason = normalizeText(body.reason);
    const points = Number(body.points);
    const status = normalizeStatus(body.status) ?? LoyaltyMovementStatus.Available;
    const kind = normalizeKind(body.kind) ?? (status === LoyaltyMovementStatus.Pending ? "earn" : "adjustment");
    const orderNumber = normalizeText(body.orderNumber);

    if (!customer || !reason || !Number.isFinite(points) || points <= 0) {
      throw new BadRequestException("Cliente, puntos y motivo son obligatorios.");
    }

    const account = this.requireOrCreateAccount(customer);
    const movement = this.createMovement({
      customer,
      orderNumber,
      kind,
      points,
      status,
      reason,
      reviewer: normalizeText(body.reviewer) ?? "sistema",
      source: orderNumber ? "order" : "manual"
    });

    this.applyMovementToAccount(account, movement);
    this.auditService.recordAdminAction({
      actionType: "loyalty.points.assigned",
      targetType: "loyalty_account",
      targetId: account.id,
      summary: `Se asignaron ${movement.points} puntos a ${customer}.`,
      actorName: movement.reviewer,
      metadata: {
        orderNumber: movement.orderNumber,
        status: movement.status,
        reason: movement.reason
      }
    });
    void this.notificationsService.recordEvent(
      "loyalty.points.updated",
      movement.source,
      customer,
      `${movement.points} puntos ${movement.status === LoyaltyMovementStatus.Pending ? "pendientes" : "disponibles"} · ${movement.reason}`,
      "loyalty_movement",
      movement.id
    );

    void this.notificationsService.queueNotification({
      channel: NotificationChannel.Email,
      audience: customer,
      subject: "Tus puntos de Huelegood se actualizaron",
      body:
        movement.status === LoyaltyMovementStatus.Pending
          ? `${movement.points} puntos quedaron pendientes por ${movement.reason}.`
          : `${movement.points} puntos ya están disponibles por ${movement.reason}.`,
      source: "loyalty",
      relatedType: "loyalty_movement",
      relatedId: movement.id,
      status: movement.status === LoyaltyMovementStatus.Pending ? NotificationStatus.Pending : NotificationStatus.Sent
    });
    void this.persistState();

    return {
      ...actionResponse("queued", "Los puntos de loyalty quedaron registrados.", movement.id),
      account: this.toSummary(account),
      movement: this.toMovementSummary(movement)
    };
  }

  recordOrderPoints(input: {
    customer: string;
    points: number;
    orderNumber: string;
    reviewer?: string;
    available?: boolean;
    reason?: string;
  }) {
    return this.assignPoints({
      customer: input.customer,
      points: input.points,
      reason: input.reason ?? `Pedido ${input.orderNumber}`,
      orderNumber: input.orderNumber,
      kind: "earn",
      reviewer: input.reviewer,
      status: input.available ? LoyaltyMovementStatus.Available : LoyaltyMovementStatus.Pending
    });
  }

  settleOrderPoints(orderNumber: string, reviewer?: string) {
    const movement = this.findMovementByOrderNumber(orderNumber);
    const account = this.requireAccount(movement.customer);

    if (movement.status === LoyaltyMovementStatus.Available) {
      return this.toMovementSummary(movement);
    }

    if (movement.status !== LoyaltyMovementStatus.Pending) {
      throw new BadRequestException(`El movimiento del pedido ${orderNumber} no está en espera de confirmación.`);
    }

    account.pendingPoints = Math.max(0, account.pendingPoints - movement.points);
    account.availablePoints += movement.points;
    movement.status = LoyaltyMovementStatus.Available;
    movement.reviewer = normalizeText(reviewer) ?? "operaciones";
    movement.updatedAt = nowIso();
    movement.balanceAfter = account.availablePoints + account.pendingPoints;
    account.recentMovement = movement.status;
    account.updatedAt = movement.updatedAt;
    this.auditService.recordAudit({
      module: "loyalty",
      action: "order_points_settled",
      entityType: "loyalty_movement",
      entityId: movement.id,
      summary: `Se liberaron ${movement.points} puntos del pedido ${orderNumber}.`,
      actorName: reviewer ?? "operaciones",
      payload: {
        orderNumber,
        points: movement.points,
        customer: account.customer
      }
    });

    void this.notificationsService.recordEvent(
      "loyalty.points.available",
      "orders",
      account.customer,
      `${movement.points} puntos liberados por el pedido ${orderNumber}.`,
      "loyalty_movement",
      movement.id
    );

    void this.notificationsService.queueNotification({
      channel: NotificationChannel.Email,
      audience: account.customer,
      subject: "Tus puntos ya están disponibles",
      body: `${movement.points} puntos fueron liberados por el pedido ${orderNumber}.`,
      source: "loyalty",
      relatedType: "loyalty_movement",
      relatedId: movement.id,
      status: NotificationStatus.Sent
    });
    void this.persistState();

    return this.toMovementSummary(movement);
  }

  reverseOrderPoints(orderNumber: string, reviewer?: string) {
    const movement = this.findMovementByOrderNumber(orderNumber);
    const account = this.requireAccount(movement.customer);

    if (movement.status === LoyaltyMovementStatus.Reversed) {
      return this.toMovementSummary(movement);
    }

    if (movement.status === LoyaltyMovementStatus.Pending) {
      account.pendingPoints = Math.max(0, account.pendingPoints - movement.points);
    } else if (movement.status === LoyaltyMovementStatus.Available) {
      account.availablePoints = Math.max(0, account.availablePoints - movement.points);
    } else {
      throw new BadRequestException(`El movimiento del pedido ${orderNumber} no se puede revertir.`);
    }

    movement.status = LoyaltyMovementStatus.Reversed;
    movement.reviewer = normalizeText(reviewer) ?? "operaciones";
    movement.updatedAt = nowIso();
    movement.balanceAfter = account.availablePoints + account.pendingPoints;
    account.recentMovement = movement.status;
    account.updatedAt = movement.updatedAt;
    this.auditService.recordAudit({
      module: "loyalty",
      action: "order_points_reversed",
      entityType: "loyalty_movement",
      entityId: movement.id,
      summary: `Se revirtieron ${movement.points} puntos del pedido ${orderNumber}.`,
      actorName: reviewer ?? "operaciones",
      payload: {
        orderNumber,
        points: movement.points,
        customer: account.customer
      }
    });

    void this.notificationsService.recordEvent(
      "loyalty.points.reversed",
      "orders",
      account.customer,
      `${movement.points} puntos fueron revertidos para el pedido ${orderNumber}.`,
      "loyalty_movement",
      movement.id
    );

    void this.notificationsService.queueNotification({
      channel: NotificationChannel.Email,
      audience: account.customer,
      subject: "Puntos revertidos",
      body: `Se revertieron ${movement.points} puntos asociados al pedido ${orderNumber}.`,
      source: "loyalty",
      relatedType: "loyalty_movement",
      relatedId: movement.id,
      status: NotificationStatus.Sent
    });
    void this.persistState();

    return this.toMovementSummary(movement);
  }

  createRedemption(body: LoyaltyRedemptionInput) {
    const customer = normalizeCustomer(body.customer);
    const reward = normalizeText(body.reward);
    const points = Number(body.points);
    const notes = normalizeText(body.notes);

    if (!customer || !reward || !Number.isFinite(points) || points <= 0) {
      throw new BadRequestException("Cliente, recompensa y puntos son obligatorios.");
    }

    const account = this.requireAccount(customer);
    if (account.availablePoints < points) {
      throw new ConflictException("El cliente no tiene puntos suficientes para el canje.");
    }

    const createdAt = nowIso();
    const id = `red-${String(this.redemptionSequence).padStart(3, "0")}`;
    this.redemptionSequence += 1;
    const redemption: LoyaltyRedemptionRecord = {
      id,
      customer,
      reward,
      points,
      status: RedemptionStatus.Pending,
      notes,
      reviewer: normalizeText(body.reviewer) ?? "sistema",
      reviewedAt: undefined,
      createdAt,
      updatedAt: createdAt,
      pointsReserved: points
    };

    this.redemptions.set(redemption.id, redemption);

    account.availablePoints -= points;
    account.pendingPoints += points;
    account.redemptionStatus = redemption.status;
    account.recentMovement = LoyaltyMovementStatus.Pending;
    account.updatedAt = createdAt;

    const movement = this.createMovement({
      customer,
      points,
      status: LoyaltyMovementStatus.Pending,
      kind: "redeem",
      reason: `Canje solicitado: ${reward}`,
      reviewer: normalizeText(body.reviewer) ?? "sistema",
      source: "redemption"
    });
    movement.balanceAfter = account.availablePoints + account.pendingPoints;

    void this.notificationsService.recordEvent(
      "loyalty.redemption.created",
      "loyalty",
      customer,
      `${points} puntos reservados para ${reward}.`,
      "redemption",
      redemption.id
    );

    void this.notificationsService.queueNotification({
      channel: NotificationChannel.Email,
      audience: customer,
      subject: "Canje recibido",
      body: `Tu canje de ${reward} por ${points} puntos quedó en revisión.`,
      source: "loyalty",
      relatedType: "redemption",
      relatedId: redemption.id,
      status: NotificationStatus.Pending
    });
    this.auditService.recordAdminAction({
      actionType: "loyalty.redemption.created",
      targetType: "redemption",
      targetId: redemption.id,
      summary: `El canje ${redemption.id} quedó en revisión.`,
      actorName: redemption.reviewer,
      metadata: {
        customer,
        reward,
        points
      }
    });
    void this.persistState();

    return {
      ...actionResponse("queued", "El canje quedó registrado para revisión.", redemption.id),
      redemption: this.toRedemptionSummary(redemption),
      movement: this.toMovementSummary(movement),
      account: this.toSummary(account)
    };
  }

  updateRedemptionStatus(id: string, body: LoyaltyRedemptionStatusInput) {
    const redemption = this.requireRedemption(id);
    const account = this.requireAccount(redemption.customer);
    const status = normalizeRedemptionStatus(body.status);

    if (!status) {
      throw new BadRequestException("Estado de canje inválido.");
    }

    if (status === RedemptionStatus.Pending) {
      throw new BadRequestException("El canje solo puede aprobarse o cancelarse desde backoffice.");
    }

    const reviewer = normalizeText(body.reviewer) ?? "operaciones";
    const notes = normalizeText(body.notes) ?? `Canje actualizado a ${status}.`;
    const now = nowIso();

    if (status === RedemptionStatus.Applied) {
      if (redemption.status === RedemptionStatus.Cancelled) {
        throw new BadRequestException("No se puede aplicar un canje cancelado.");
      }

      account.pendingPoints = Math.max(0, account.pendingPoints - redemption.pointsReserved);
      account.redeemedPoints += redemption.pointsReserved;
      account.redemptionStatus = RedemptionStatus.Applied;
      account.recentMovement = LoyaltyMovementStatus.Available;
    } else if (status === RedemptionStatus.Cancelled) {
      if (redemption.status === RedemptionStatus.Applied) {
        throw new BadRequestException("No se puede cancelar un canje ya aplicado.");
      }

      account.pendingPoints = Math.max(0, account.pendingPoints - redemption.pointsReserved);
      account.availablePoints += redemption.pointsReserved;
      account.redemptionStatus = RedemptionStatus.Cancelled;
      account.recentMovement = LoyaltyMovementStatus.Reversed;
    } else {
      account.redemptionStatus = RedemptionStatus.Pending;
      account.recentMovement = LoyaltyMovementStatus.Pending;
    }

    redemption.status = status;
    redemption.reviewer = reviewer;
    redemption.reviewedAt = now;
    redemption.notes = notes;
    redemption.updatedAt = now;
    account.updatedAt = now;

    void this.notificationsService.recordEvent(
      `loyalty.redemption.${status}`,
      "loyalty",
      account.customer,
      notes,
      "redemption",
      redemption.id
    );

    void this.notificationsService.queueNotification({
      channel: NotificationChannel.Email,
      audience: account.customer,
      subject: status === RedemptionStatus.Applied ? "Canje aplicado" : "Canje actualizado",
      body:
        status === RedemptionStatus.Applied
          ? `Tu canje de ${redemption.reward} fue aplicado.`
          : status === RedemptionStatus.Cancelled
            ? `Tu canje de ${redemption.reward} fue cancelado y los puntos regresaron a tu cuenta.`
            : `Tu canje de ${redemption.reward} sigue en revisión.`,
      source: "loyalty",
      relatedType: "redemption",
      relatedId: redemption.id,
      status: NotificationStatus.Sent
    });
    this.auditService.recordAdminAction({
      actionType: `loyalty.redemption.${status}`,
      targetType: "redemption",
      targetId: redemption.id,
      summary: `El canje ${redemption.id} quedó ${status}.`,
      actorName: reviewer,
      metadata: {
        customer: account.customer,
        reward: redemption.reward,
        points: redemption.pointsReserved,
        notes
      }
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "El canje quedó actualizado.", redemption.id),
      redemption: this.toRedemptionSummary(redemption),
      account: this.toSummary(account)
    };
  }

  private getPrimaryAccount() {
    const preferredCustomer = loyaltyOverview[0]?.customer.trim().toLowerCase();
    if (preferredCustomer && this.accounts.has(preferredCustomer)) {
      return this.accounts.get(preferredCustomer) ?? null;
    }

    return Array.from(this.accounts.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0] ?? null;
  }

  private requireAccount(customer: string) {
    const key = customer.trim().toLowerCase();
    const account = this.accounts.get(key);
    if (!account) {
      throw new NotFoundException(`No encontramos una cuenta de loyalty para ${customer}.`);
    }

    return account;
  }

  private requireOrCreateAccount(customer: string) {
    const key = customer.trim().toLowerCase();
    const existing = this.accounts.get(key);
    if (existing) {
      return existing;
    }

    const createdAt = nowIso();
    const account: LoyaltyAccountRecord = {
      id: `acc-${key.replace(/[^a-z0-9]+/g, "-")}`,
      customer,
      availablePoints: 0,
      pendingPoints: 0,
      redeemedPoints: 0,
      recentMovement: LoyaltyMovementStatus.Pending,
      redemptionStatus: RedemptionStatus.Pending,
      email: undefined,
      updatedAt: createdAt
    };
    this.accounts.set(key, account);
    return account;
  }

  private createMovement(input: {
    customer: string;
    orderNumber?: string;
    kind: LoyaltyMovementSummary["kind"];
    points: number;
    status: LoyaltyMovementStatus;
    reason: string;
    reviewer?: string;
    source: string;
  }) {
    const createdAt = nowIso();
    const id = `lm-${String(this.movementSequence).padStart(3, "0")}`;
    this.movementSequence += 1;
    const account = this.requireOrCreateAccount(input.customer);
    const balanceBefore = account.availablePoints + account.pendingPoints;

    const movement: LoyaltyMovementRecord = {
      id,
      customer: input.customer,
      orderNumber: input.orderNumber,
      kind: input.kind,
      points: input.points,
      balanceAfter: balanceBefore,
      status: input.status,
      reason: input.reason,
      reviewer: input.reviewer,
      createdAt,
      updatedAt: createdAt,
      source: input.source
    };

    this.movements.set(movement.id, movement);
    return movement;
  }

  private applyMovementToAccount(account: LoyaltyAccountRecord, movement: LoyaltyMovementRecord) {
    if (movement.kind === "redeem") {
      account.availablePoints = Math.max(0, account.availablePoints - movement.points);
      account.pendingPoints += movement.points;
      account.redemptionStatus = RedemptionStatus.Pending;
      account.recentMovement = LoyaltyMovementStatus.Pending;
    } else if (movement.status === LoyaltyMovementStatus.Pending) {
      account.pendingPoints += movement.points;
      account.recentMovement = LoyaltyMovementStatus.Pending;
    } else if (movement.status === LoyaltyMovementStatus.Available) {
      account.availablePoints += movement.points;
      account.recentMovement = LoyaltyMovementStatus.Available;
    } else {
      account.recentMovement = movement.status;
    }

    account.updatedAt = movement.updatedAt;
    movement.balanceAfter = account.availablePoints + account.pendingPoints;
  }

  private findMovementByOrderNumber(orderNumber: string) {
    const movement = Array.from(this.movements.values()).find((item) => item.orderNumber === orderNumber.trim());
    if (!movement) {
      throw new NotFoundException(`No encontramos puntos asociados al pedido ${orderNumber}.`);
    }

    return movement;
  }

  private requireRedemption(id: string) {
    const redemption = this.redemptions.get(id.trim());
    if (!redemption) {
      throw new NotFoundException(`No encontramos un canje con id ${id}.`);
    }

    return redemption;
  }

  private toSummary(account: LoyaltyAccountRecord): LoyaltyAccountSummary {
    return {
      customer: account.customer,
      availablePoints: account.availablePoints,
      pendingPoints: account.pendingPoints,
      redeemedPoints: account.redeemedPoints,
      recentMovement: account.recentMovement,
      redemptionStatus: account.redemptionStatus
    };
  }

  private toMovementSummary(movement: LoyaltyMovementRecord): LoyaltyMovementSummary {
    return {
      id: movement.id,
      customer: movement.customer,
      orderNumber: movement.orderNumber,
      kind: movement.kind,
      points: movement.points,
      balanceAfter: movement.balanceAfter,
      status: movement.status,
      reason: movement.reason,
      reviewer: movement.reviewer,
      createdAt: movement.createdAt,
      updatedAt: movement.updatedAt
    };
  }

  private toRedemptionSummary(redemption: LoyaltyRedemptionRecord): LoyaltyRedemptionSummary {
    return {
      id: redemption.id,
      customer: redemption.customer,
      reward: redemption.reward,
      points: redemption.points,
      status: redemption.status,
      notes: redemption.notes,
      reviewer: redemption.reviewer,
      reviewedAt: redemption.reviewedAt,
      createdAt: redemption.createdAt,
      updatedAt: redemption.updatedAt
    };
  }

  private totalAvailablePoints() {
    return Array.from(this.accounts.values()).reduce((sum, account) => sum + account.availablePoints, 0);
  }

  private totalPendingPoints() {
    return Array.from(this.accounts.values()).reduce((sum, account) => sum + account.pendingPoints, 0);
  }

  private totalRedeemedPoints() {
    return Array.from(this.accounts.values()).reduce((sum, account) => sum + account.redeemedPoints, 0);
  }

  private seedData() {
    const seedAccounts: LoyaltyAccountRecord[] = [
      {
        id: "acc-laura-mendoza",
        customer: loyaltyOverview[0]?.customer ?? "Laura M.",
        availablePoints: loyaltyOverview[0]?.availablePoints ?? 120,
        pendingPoints: loyaltyOverview[0]?.pendingPoints ?? 40,
        redeemedPoints: loyaltyOverview[0]?.redeemedPoints ?? 60,
        recentMovement: loyaltyOverview[0]?.recentMovement ?? LoyaltyMovementStatus.Available,
        redemptionStatus: loyaltyOverview[0]?.redemptionStatus ?? RedemptionStatus.Applied,
        email: "laura@example.com",
        updatedAt: "2026-03-18T10:08:00.000Z"
      },
      {
        id: "acc-carlos-gomez",
        customer: "Carlos Gómez",
        availablePoints: 75,
        pendingPoints: 25,
        redeemedPoints: 10,
        recentMovement: LoyaltyMovementStatus.Pending,
        redemptionStatus: RedemptionStatus.Pending,
        email: "carlos@example.com",
        updatedAt: "2026-03-18T10:22:30.000Z"
      },
      {
        id: "acc-sofia-rivera",
        customer: "Sofía Rivera",
        availablePoints: 180,
        pendingPoints: 0,
        redeemedPoints: 90,
        recentMovement: LoyaltyMovementStatus.Available,
        redemptionStatus: RedemptionStatus.Applied,
        email: "sofia@example.com",
        updatedAt: "2026-03-18T10:42:00.000Z"
      }
    ];

    for (const account of seedAccounts) {
      this.accounts.set(account.customer.trim().toLowerCase(), account);
    }

    const seedMovements: LoyaltyMovementRecord[] = [
      {
        id: "lm-001",
        customer: seedAccounts[0].customer,
        orderNumber: "HG-10040",
        kind: "earn",
        points: 18,
        balanceAfter: seedAccounts[0].availablePoints + seedAccounts[0].pendingPoints,
        status: LoyaltyMovementStatus.Available,
        reason: "Pedido pagado y confirmado.",
        reviewer: "sistema",
        createdAt: "2026-03-18T10:08:00.000Z",
        updatedAt: "2026-03-18T10:08:00.000Z",
        source: "orders"
      },
      {
        id: "lm-002",
        customer: seedAccounts[1].customer,
        orderNumber: "HG-10041",
        kind: "earn",
        points: 9,
        balanceAfter: seedAccounts[1].availablePoints + seedAccounts[1].pendingPoints,
        status: LoyaltyMovementStatus.Pending,
        reason: "Pedido manual en revisión.",
        reviewer: "sistema",
        createdAt: "2026-03-18T10:22:30.000Z",
        updatedAt: "2026-03-18T10:22:30.000Z",
        source: "orders"
      },
      {
        id: "lm-003",
        customer: seedAccounts[0].customer,
        kind: "bonus",
        points: 20,
        balanceAfter: seedAccounts[0].availablePoints + seedAccounts[0].pendingPoints,
        status: LoyaltyMovementStatus.Available,
        reason: "Bonificación por campaña de recompra.",
        reviewer: "marketing",
        createdAt: "2026-03-18T10:00:30.000Z",
        updatedAt: "2026-03-18T10:00:30.000Z",
        source: "marketing"
      },
      {
        id: "lm-004",
        customer: seedAccounts[1].customer,
        kind: "redeem",
        points: 25,
        balanceAfter: seedAccounts[1].availablePoints + seedAccounts[1].pendingPoints,
        status: LoyaltyMovementStatus.Pending,
        reason: "Canje de envío gratis.",
        reviewer: "sistema",
        createdAt: "2026-03-18T10:24:00.000Z",
        updatedAt: "2026-03-18T10:24:00.000Z",
        source: "redemption"
      }
    ];

    const seedRedemptions: LoyaltyRedemptionRecord[] = [
      {
        id: "red-001",
        customer: seedAccounts[1].customer,
        reward: "Envío gratis",
        points: 25,
        status: RedemptionStatus.Pending,
        notes: "Canje solicitado desde el checkout.",
        reviewer: "operaciones",
        reviewedAt: undefined,
        createdAt: "2026-03-18T10:24:00.000Z",
        updatedAt: "2026-03-18T10:24:00.000Z",
        pointsReserved: 25
      },
      {
        id: "red-002",
        customer: seedAccounts[0].customer,
        reward: "Descuento próxima compra",
        points: 30,
        status: RedemptionStatus.Applied,
        notes: "Canje aplicado y notificado.",
        reviewer: "operaciones",
        reviewedAt: "2026-03-18T10:10:00.000Z",
        createdAt: "2026-03-18T10:09:00.000Z",
        updatedAt: "2026-03-18T10:10:00.000Z",
        pointsReserved: 30
      }
    ];

    const seedRules: LoyaltyRuleRecord[] = [
      {
        id: "rule-001",
        name: "Punto base por compra",
        description: "1 punto por cada 50 MXN pagados en pedidos confirmados.",
        trigger: "Pedido pagado",
        pointsPerUnit: 1,
        status: "active",
        updatedAt: "2026-03-18T09:00:00.000Z"
      },
      {
        id: "rule-002",
        name: "Bonificación por combo",
        description: "Bonificación manual para bundles y campañas especiales.",
        trigger: "Promo o bundle",
        pointsPerUnit: 20,
        status: "active",
        updatedAt: "2026-03-18T09:00:00.000Z"
      },
      {
        id: "rule-003",
        name: "Ajuste por revisión",
        description: "Regla reservada para correcciones administrativas.",
        trigger: "Ajuste manual",
        pointsPerUnit: 0,
        status: "inactive",
        updatedAt: "2026-03-18T09:00:00.000Z"
      }
    ];

    for (const movement of seedMovements) {
      this.movements.set(movement.id, movement);
    }

    for (const redemption of seedRedemptions) {
      this.redemptions.set(redemption.id, redemption);
    }

    for (const rule of seedRules) {
      this.rules.set(rule.id, rule);
    }

    const movementSequence = seedMovements.reduce((max, movement) => {
      const numeric = Number(movement.id.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    this.movementSequence = Math.max(this.movementSequence, movementSequence + 1);

    const redemptionSequence = seedRedemptions.reduce((max, redemption) => {
      const numeric = Number(redemption.id.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    this.redemptionSequence = Math.max(this.redemptionSequence, redemptionSequence + 1);

    const ruleSequence = seedRules.reduce((max, rule) => {
      const numeric = Number(rule.id.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    this.ruleSequence = Math.max(this.ruleSequence, ruleSequence + 1);
  }

  private restoreSnapshot(snapshot: LoyaltySnapshot) {
    this.accounts.clear();
    this.movements.clear();
    this.redemptions.clear();
    this.rules.clear();

    for (const account of snapshot.accounts ?? []) {
      this.accounts.set(account.customer.trim().toLowerCase(), account);
    }

    for (const movement of snapshot.movements ?? []) {
      this.movements.set(movement.id, movement);
    }

    for (const redemption of snapshot.redemptions ?? []) {
      this.redemptions.set(redemption.id, redemption);
    }

    for (const rule of snapshot.rules ?? []) {
      this.rules.set(rule.id, rule);
    }

    this.syncSequences();
  }

  private syncSequences() {
    const movementSequence = Array.from(this.movements.values()).reduce((max, movement) => {
      const numeric = Number(movement.id.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    const redemptionSequence = Array.from(this.redemptions.values()).reduce((max, redemption) => {
      const numeric = Number(redemption.id.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    const ruleSequence = Array.from(this.rules.values()).reduce((max, rule) => {
      const numeric = Number(rule.id.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);

    this.movementSequence = Math.max(movementSequence + 1, 1);
    this.redemptionSequence = Math.max(redemptionSequence + 1, 1);
    this.ruleSequence = Math.max(ruleSequence + 1, 1);
  }

  private async persistState() {
    await this.moduleStateService.save<LoyaltySnapshot>("loyalty", this.buildSnapshot());
  }

  private buildSnapshot(): LoyaltySnapshot {
    return {
      accounts: Array.from(this.accounts.values()).map((account) => ({ ...account })),
      movements: Array.from(this.movements.values()).map((movement) => ({ ...movement })),
      redemptions: Array.from(this.redemptions.values()).map((redemption) => ({ ...redemption })),
      rules: Array.from(this.rules.values()).map((rule) => ({ ...rule }))
    };
  }
}
