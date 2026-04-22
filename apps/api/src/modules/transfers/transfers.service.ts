import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  WarehouseTransferCancelInput,
  WarehouseTransferCreateInput,
  WarehouseTransferDispatchInput,
  WarehouseTransferHistorySummary,
  WarehouseTransferIncidentKindValue,
  WarehouseTransferIncidentStatusValue,
  WarehouseTransferIncidentSummary,
  WarehouseTransferGuideInput,
  WarehouseTransferGuideSummary,
  WarehouseTransferLineSummary,
  WarehouseTransferPackageSnapshotInput,
  WarehouseTransferPackageSnapshotSummary,
  WarehouseTransferReconcileInput,
  WarehouseTransferReceiveInput,
  WarehouseTransferReceiveLineInput,
  WarehouseTransferStickerInput,
  WarehouseTransferStickerSummary,
  WarehouseTransferLogisticsSummary,
  WarehouseTransferSummary
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { PrismaService } from "../../prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";

const warehouseTransferWithLinesAndDocuments = Prisma.validator<Prisma.WarehouseTransferDefaultArgs>()({
  include: {
    lines: {
      orderBy: {
        sortOrder: "asc"
      }
    },
    documents: {
      orderBy: {
        createdAt: "asc"
      }
    },
    incident: true
  }
});

type WarehouseTransferRecord = Prisma.WarehouseTransferGetPayload<typeof warehouseTransferWithLinesAndDocuments>;
type WarehouseTransferDocumentRecord = WarehouseTransferRecord["documents"][number];

type TransferSnapshotLine = {
  variantId: string;
  sku: string;
  name: string;
  quantity: number;
  dispatchedQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
};

type TransferSnapshotBase = {
  transferId: string;
  transferNumber: string;
  originWarehouseId: string;
  originWarehouseCode: string;
  originWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseCode: string;
  destinationWarehouseName: string;
  lineCount: number;
  totalUnits: number;
  lines: TransferSnapshotLine[];
};

type TransferIncidentLinePayload = {
  variantId: string;
  sku: string;
  name: string;
  expectedQuantity: number;
  receivedQuantity: number;
  differenceQuantity: number;
};

type TransferIncidentPayload = {
  transferId: string;
  transferNumber: string;
  status: WarehouseTransferIncidentStatusValue;
  kind: WarehouseTransferIncidentKindValue;
  notes?: string;
  openedByUserId?: string;
  resolvedByUserId?: string;
  openedAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
  totalExpectedUnits: number;
  totalReceivedUnits: number;
  totalDifferenceUnits: number;
  lines: TransferIncidentLinePayload[];
};

type TransferPackageSnapshotPayload = TransferSnapshotBase & {
  packageId: string;
  packageCount: number;
  packageIndex: number;
  packedAt: string;
  packedByUserId?: string;
  notes?: string;
  declaredWeight?: number;
};

type TransferGuidePayload = TransferSnapshotBase & {
  guideType: WarehouseTransferGuideSummary["guideType"];
  series: string;
  number: string;
  referenceCode: string;
  qrValue: string;
  motive: string;
  transportMode: WarehouseTransferGuideSummary["transportMode"];
  issuedAt: string;
  issuedByUserId?: string;
  notes?: string;
};

type TransferStickerPayload = TransferSnapshotBase & {
  stickerCode: string;
  guideReference?: string;
  generatedAt: string;
  generatedByUserId?: string;
  printedAt?: string;
  printedByUserId?: string;
  notes?: string;
};

function normalizeText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeTransferReference(value: string) {
  return value.trim().toUpperCase();
}

function normalizeOccurredAt(value?: string) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return new Date();
  }

  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) {
    throw new BadRequestException("La fecha enviada para la transferencia es inválida.");
  }

  return new Date(timestamp);
}

function normalizePositiveQuantity(value: unknown, field: string) {
  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new BadRequestException(`El campo ${field} debe ser un entero mayor a cero.`);
  }

  return parsed;
}

@Injectable()
export class TransfersService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService
  ) {}

  async onModuleInit() {}

  async listTransfers() {
    const transfers = await this.prisma.warehouseTransfer.findMany({
      ...warehouseTransferWithLinesAndDocuments,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    });

    const mapped = transfers.map((transfer) => this.mapTransfer(transfer));
    return wrapResponse(mapped, {
      total: mapped.length,
      reserved: mapped.filter((transfer) => transfer.status === "reserved").length,
      inTransit: mapped.filter((transfer) => transfer.status === "in_transit").length,
      partialReceived: mapped.filter((transfer) => transfer.status === "partial_received").length,
      received: mapped.filter((transfer) => transfer.status === "received").length,
      cancelled: mapped.filter((transfer) => transfer.status === "cancelled").length
    });
  }

  async getTransfer(id: string) {
    const transfer = await this.findTransfer(id);
    return transfer ? wrapResponse(this.mapTransfer(transfer), { found: true }) : null;
  }

  async createTransfer(input: WarehouseTransferCreateInput) {
    const normalized = this.normalizeCreateInput(input);
    const [originWarehouse, destinationWarehouse] = await Promise.all([
      this.requireActiveWarehouse(normalized.originWarehouseId),
      this.requireActiveWarehouse(normalized.destinationWarehouseId)
    ]);

    if (originWarehouse.id === destinationWarehouse.id) {
      throw new ConflictException("La transferencia requiere almacenes distintos en origen y destino.");
    }

    const lines = await this.resolveTransferLines(normalized.lines);
    const transferNumber = await this.buildTransferNumber();
    const createdAt = normalizeOccurredAt(normalized.requestedAt);
    const createdAtIso = createdAt.toISOString();
    const reservationNote = normalized.notes ?? `Reserva inicial para ${normalized.reason}.`;

    await this.inventoryService.reserveTransfer(
      transferNumber,
      lines.map((line) => ({
        variantId: line.variantId,
        warehouseId: originWarehouse.id,
        quantity: line.quantity
      })),
      createdAtIso,
      reservationNote
    );

    const transfer = await this.prisma.warehouseTransfer.create({
      ...warehouseTransferWithLinesAndDocuments,
      data: {
        transferNumber,
        status: "reserved",
        reason: normalized.reason,
        notes: normalized.notes ?? null,
        originWarehouseId: originWarehouse.id,
        originWarehouseCodeSnapshot: originWarehouse.code,
        originWarehouseNameSnapshot: originWarehouse.name,
        destinationWarehouseId: destinationWarehouse.id,
        destinationWarehouseCodeSnapshot: destinationWarehouse.code,
        destinationWarehouseNameSnapshot: destinationWarehouse.name,
        requestedByUserId: normalized.requestedByUserId ?? null,
        reservationNote,
        createdAt,
        updatedAt: createdAt,
        lines: {
          create: lines.map((line, index) => ({
            variantId: line.variantId,
            skuSnapshot: line.sku,
            nameSnapshot: line.name,
            quantity: line.quantity,
            dispatchedQuantity: 0,
            receivedQuantity: 0,
            sortOrder: index
          }))
        }
      }
    });

    const summary = this.mapTransfer(transfer);
    return {
      ...actionResponse("ok", `Transferencia ${summary.transferNumber} creada y reservada.`, summary.id),
      transfer: summary
    };
  }

  async dispatchTransfer(id: string, input: WarehouseTransferDispatchInput) {
    const transfer = await this.requireTransfer(id);
    if (transfer.status !== "reserved") {
      throw new ConflictException(`La transferencia ${transfer.transferNumber} no está lista para despacho.`);
    }

    const dispatchedAt = normalizeOccurredAt(input.dispatchedAt);
    const dispatchedAtIso = dispatchedAt.toISOString();
    const note = normalizeText(input.notes) ?? "Transferencia despachada a tránsito.";

    await this.inventoryService.dispatchTransfer(
      transfer.transferNumber,
      transfer.lines.map((line) => ({
        variantId: line.variantId,
        warehouseId: transfer.originWarehouseId,
        quantity: line.quantity
      })),
      dispatchedAtIso,
      note
    );

    const updated = await this.prisma.warehouseTransfer.update({
      ...warehouseTransferWithLinesAndDocuments,
      where: {
        id: transfer.id
      },
      data: {
        status: "in_transit",
        dispatchedAt,
        dispatchedByUserId: normalizeText(input.dispatchedByUserId) ?? null,
        dispatchNote: note,
        updatedAt: dispatchedAt
      }
    });

    for (const line of transfer.lines) {
      await this.prisma.warehouseTransferLine.update({
        where: {
          id: line.id
        },
        data: {
          dispatchedQuantity: line.quantity,
          receivedQuantity: 0
        }
      });
    }

    const summary = this.mapTransfer(updated);
    return {
      ...actionResponse("ok", `Transferencia ${summary.transferNumber} despachada.`, summary.id),
      transfer: summary
    };
  }

  async receiveTransfer(id: string, input: WarehouseTransferReceiveInput) {
    const transfer = await this.requireTransfer(id);
    if (transfer.status !== "in_transit" && transfer.status !== "partial_received") {
      throw new ConflictException(`La transferencia ${transfer.transferNumber} no está lista para recepción.`);
    }

    const receivedAt = normalizeOccurredAt(input.receivedAt);
    const receivedAtIso = receivedAt.toISOString();
    const receivedByUserId = normalizeText(input.receivedByUserId) ?? null;
    const note = normalizeText(input.notes) ?? "Transferencia recibida en almacén destino.";
    const receiveLines = this.normalizeReceiveLines(transfer, input.lines, input.incidentKind);

    const actualReceivedLines = receiveLines.map((line) => ({
      variantId: line.variantId,
      warehouseId: transfer.destinationWarehouseId,
      quantity: line.quantity
    }));

    await this.inventoryService.receiveTransfer(transfer.transferNumber, actualReceivedLines, receivedAtIso, note);

    for (const line of receiveLines) {
      const transferLine = transfer.lines.find((record) => record.variantId === line.variantId);
      if (!transferLine) {
        continue;
      }

      await this.prisma.warehouseTransferLine.update({
        where: {
          id: transferLine.id
        },
        data: {
          receivedQuantity: transferLine.receivedQuantity + line.quantity
        }
      });
    }

    const refreshed = await this.requireTransfer(transfer.id);
    const incidentSnapshot = this.buildIncidentSnapshot(refreshed, {
      kind: input.incidentKind,
      notes: normalizeText(input.incidentNotes),
      openedByUserId: receivedByUserId ?? undefined,
      openedAt: receivedAtIso
    });
    const hasDiscrepancy = incidentSnapshot.totalDifferenceUnits !== 0;
    const hasOpenIncident = Boolean(refreshed.incident && refreshed.incident.status === "open");
    const shouldOpenIncident = hasDiscrepancy;
    const shouldAutoResolveIncident = !hasDiscrepancy && hasOpenIncident;
    const status: WarehouseTransferSummary["status"] = shouldOpenIncident ? "partial_received" : "received";

    if (shouldOpenIncident) {
      await this.prisma.warehouseTransferIncident.upsert({
        where: {
          transferId: refreshed.id
        },
        create: {
          transferId: refreshed.id,
          transferNumber: refreshed.transferNumber,
          status: "open",
          kind: incidentSnapshot.kind,
          notes: incidentSnapshot.notes ?? null,
          openedByUserId: receivedByUserId,
          openedAt: receivedAt,
          payload: incidentSnapshot
        },
        update: {
          status: "open",
          kind: incidentSnapshot.kind,
          notes: incidentSnapshot.notes ?? null,
          openedByUserId: refreshed.incident?.openedByUserId ?? receivedByUserId,
          payload: incidentSnapshot,
          resolvedAt: null,
          resolvedByUserId: null,
          resolutionNote: null,
          updatedAt: receivedAt
        }
      });
    } else if (shouldAutoResolveIncident && refreshed.incident) {
      await this.prisma.warehouseTransferIncident.update({
        where: {
          transferId: refreshed.id
        },
        data: {
          status: "resolved",
          resolvedAt: receivedAt,
          resolvedByUserId: receivedByUserId,
          resolutionNote: note,
          payload: incidentSnapshot,
          updatedAt: receivedAt
        }
      });
    }

    const data: Prisma.WarehouseTransferUpdateInput = {
      status,
      receivedAt: status === "received" ? receivedAt : refreshed.receivedAt,
      receivedByUserId: receivedByUserId ?? refreshed.receivedByUserId,
      receiveNote: note,
      partialReceivedAt: shouldOpenIncident ? refreshed.partialReceivedAt ?? receivedAt : refreshed.partialReceivedAt,
      partialReceivedByUserId: shouldOpenIncident ? receivedByUserId ?? refreshed.partialReceivedByUserId : refreshed.partialReceivedByUserId,
      partialReceivedNote: shouldOpenIncident ? note : refreshed.partialReceivedNote,
      updatedAt: receivedAt
    };

    const updated = await this.prisma.warehouseTransfer.update({
      ...warehouseTransferWithLinesAndDocuments,
      where: {
        id: transfer.id
      },
      data
    });

    const summary = this.mapTransfer(updated);
    return {
      ...actionResponse(
        "ok",
        summary.status === "received"
          ? `Transferencia ${summary.transferNumber} recibida.`
          : `Transferencia ${summary.transferNumber} recibida parcialmente y con incidencia abierta.`,
        summary.id
      ),
      transfer: summary
    };
  }

  async cancelTransfer(id: string, input: WarehouseTransferCancelInput) {
    const transfer = await this.requireTransfer(id);
    if (transfer.status !== "reserved") {
      throw new ConflictException(`Solo se puede cancelar una transferencia reservada. Estado actual: ${transfer.status}.`);
    }

    const cancelledAt = normalizeOccurredAt(input.cancelledAt);
    const cancelledAtIso = cancelledAt.toISOString();
    const note = normalizeText(input.notes) ?? "Transferencia cancelada antes del despacho.";

    await this.inventoryService.releaseTransferReservation(
      transfer.transferNumber,
      transfer.lines.map((line) => ({
        variantId: line.variantId,
        warehouseId: transfer.originWarehouseId,
        quantity: line.quantity
      })),
      cancelledAtIso,
      note
    );

    const updated = await this.prisma.warehouseTransfer.update({
      ...warehouseTransferWithLinesAndDocuments,
      where: {
        id: transfer.id
      },
      data: {
        status: "cancelled",
        cancelledAt,
        cancelledByUserId: normalizeText(input.cancelledByUserId) ?? null,
        cancelNote: note,
        updatedAt: cancelledAt
      }
    });

    const summary = this.mapTransfer(updated);
    return {
      ...actionResponse("ok", `Transferencia ${summary.transferNumber} cancelada.`, summary.id),
      transfer: summary
    };
  }

  async reconcileTransfer(id: string, input: WarehouseTransferReconcileInput = {}) {
    const transfer = await this.requireTransfer(id);
    if (!transfer.incident || transfer.incident.status !== "open") {
      throw new ConflictException(`La transferencia ${transfer.transferNumber} no tiene una incidencia abierta para reconciliar.`);
    }

    const resolvedAt = normalizeOccurredAt(input.resolvedAt);
    const resolvedAtIso = resolvedAt.toISOString();
    const resolvedByUserId = normalizeText(input.resolvedByUserId) ?? null;
    const note = normalizeText(input.notes) ?? "Incidencia conciliada y transferencia cerrada.";
    const incidentSnapshot = this.buildIncidentSnapshot(transfer, {
      status: "resolved",
      notes: transfer.incident.notes ?? undefined,
      resolvedByUserId: resolvedByUserId ?? undefined,
      resolvedAt: resolvedAtIso,
      resolutionNote: note
    });

    await this.prisma.warehouseTransferIncident.update({
      where: {
        transferId: transfer.id
      },
      data: {
        status: "resolved",
        resolvedAt,
        resolvedByUserId,
        resolutionNote: note,
        payload: incidentSnapshot,
        updatedAt: resolvedAt
      }
    });

    const updated = await this.prisma.warehouseTransfer.update({
      ...warehouseTransferWithLinesAndDocuments,
      where: {
        id: transfer.id
      },
      data: {
        status: "received",
        receivedAt: resolvedAt,
        receivedByUserId: resolvedByUserId ?? transfer.receivedByUserId,
        receiveNote: note,
        partialReceivedAt: transfer.partialReceivedAt ?? resolvedAt,
        partialReceivedByUserId: transfer.partialReceivedByUserId ?? resolvedByUserId,
        partialReceivedNote: transfer.partialReceivedNote ?? note,
        updatedAt: resolvedAt
      }
    });

    const summary = this.mapTransfer(updated);
    return {
      ...actionResponse("ok", `Incidencia conciliada para ${summary.transferNumber}.`, summary.id),
      transfer: summary
    };
  }

  async createPackageSnapshot(id: string, input: WarehouseTransferPackageSnapshotInput = {}) {
    const transfer = await this.requireTransfer(id);
    const existing = this.findDocument(transfer, "package_snapshot");
    if (!existing && transfer.status !== "reserved") {
      throw new ConflictException(`La transferencia ${transfer.transferNumber} ya no está en reserva para congelar el paquete.`);
    }

    const packedAt = normalizeOccurredAt(input.packedAt);
    const payload = this.buildPackageSnapshotPayload(transfer, input, packedAt.toISOString());

    await this.prisma.warehouseTransferDocument.upsert({
      where: {
        transferId_kind: {
          transferId: transfer.id,
          kind: "package_snapshot"
        }
      },
      create: {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        kind: "package_snapshot",
        templateVersion: "transfer-package-snapshot-v1",
        referenceCode: payload.packageId,
        actorUserId: normalizeText(input.packedByUserId) ?? null,
        payload
      },
      update: {}
    });

    const updated = await this.requireTransfer(transfer.id);
    const message = existing
      ? `Paquete operativo reutilizado para ${updated.transferNumber}.`
      : `Paquete operativo congelado para ${updated.transferNumber}.`;

    return {
      ...actionResponse("ok", message, updated.id),
      transfer: this.mapTransfer(updated)
    };
  }

  async createGre(id: string, input: WarehouseTransferGuideInput = {}) {
    const transfer = await this.requireTransfer(id);
    await this.ensurePackageSnapshot(transfer);
    const refreshedTransfer = await this.requireTransfer(transfer.id);
    const existing = this.findDocument(refreshedTransfer, "gre");
    if (!existing && refreshedTransfer.status !== "reserved") {
      throw new ConflictException(`La transferencia ${refreshedTransfer.transferNumber} ya no está en reserva para emitir GRE.`);
    }

    const issuedAt = normalizeOccurredAt(input.issuedAt);
    const payload = this.buildGuidePayload(refreshedTransfer, input, issuedAt.toISOString());

    await this.prisma.warehouseTransferDocument.upsert({
      where: {
        transferId_kind: {
          transferId: transfer.id,
          kind: "gre"
        }
      },
      create: {
        transferId: refreshedTransfer.id,
        transferNumber: refreshedTransfer.transferNumber,
        kind: "gre",
        templateVersion: "transfer-gre-v1",
        referenceCode: payload.referenceCode,
        actorUserId: normalizeText(input.issuedByUserId) ?? null,
        payload
      },
      update: {}
    });

    const updated = await this.requireTransfer(refreshedTransfer.id);
    const message = existing
      ? `GRE reutilizada para ${updated.transferNumber}.`
      : `GRE emitida para ${updated.transferNumber}.`;

    return {
      ...actionResponse("ok", message, updated.id),
      transfer: this.mapTransfer(updated)
    };
  }

  async createSticker(id: string, input: WarehouseTransferStickerInput = {}) {
    const transfer = await this.requireTransfer(id);
    await this.ensurePackageSnapshot(transfer);
    const refreshedTransfer = await this.requireTransfer(transfer.id);
    const existing = this.findDocument(refreshedTransfer, "sticker");
    if (!existing && refreshedTransfer.status !== "reserved") {
      throw new ConflictException(`La transferencia ${refreshedTransfer.transferNumber} ya no está en reserva para generar el sticker.`);
    }

    const generatedAt = normalizeOccurredAt(input.generatedAt);
    const payload = this.buildStickerPayload(refreshedTransfer, input, generatedAt.toISOString());

    await this.prisma.warehouseTransferDocument.upsert({
      where: {
        transferId_kind: {
          transferId: transfer.id,
          kind: "sticker"
        }
      },
      create: {
        transferId: refreshedTransfer.id,
        transferNumber: refreshedTransfer.transferNumber,
        kind: "sticker",
        templateVersion: "transfer-sticker-v1",
        referenceCode: payload.stickerCode,
        actorUserId: normalizeText(input.generatedByUserId) ?? normalizeText(input.printedByUserId) ?? null,
        payload
      },
      update: {}
    });

    const updated = await this.requireTransfer(refreshedTransfer.id);
    const message = existing
      ? `Sticker reutilizado para ${updated.transferNumber}.`
      : `Sticker generado para ${updated.transferNumber}.`;

    return {
      ...actionResponse("ok", message, updated.id),
      transfer: this.mapTransfer(updated)
    };
  }

  private async findTransfer(id: string) {
    const direct = await this.prisma.warehouseTransfer.findUnique({
      ...warehouseTransferWithLinesAndDocuments,
      where: {
        id
      }
    });
    if (direct) {
      return direct;
    }

    const normalized = normalizeTransferReference(id);
    if (!normalized) {
      return null;
    }

    return this.prisma.warehouseTransfer.findUnique({
      ...warehouseTransferWithLinesAndDocuments,
      where: {
        transferNumber: normalized
      }
    });
  }

  private async requireTransfer(id: string) {
    const transfer = await this.findTransfer(id);
    if (!transfer) {
      throw new NotFoundException(`Transferencia no encontrada: ${id}`);
    }

    return transfer;
  }

  private findDocument(record: WarehouseTransferRecord, kind: WarehouseTransferDocumentRecord["kind"]) {
    return record.documents.find((document) => document.kind === kind);
  }

  private async ensurePackageSnapshot(
    transfer: WarehouseTransferRecord,
    input: WarehouseTransferPackageSnapshotInput = {}
  ) {
    const existing = this.findDocument(transfer, "package_snapshot");
    if (existing) {
      return existing;
    }

    if (transfer.status !== "reserved") {
      throw new ConflictException(`La transferencia ${transfer.transferNumber} requiere una reserva activa para congelar el paquete.`);
    }

    const packedAt = normalizeOccurredAt(input.packedAt);
    const payload = this.buildPackageSnapshotPayload(transfer, input, packedAt.toISOString());

    return this.prisma.warehouseTransferDocument.upsert({
      where: {
        transferId_kind: {
          transferId: transfer.id,
          kind: "package_snapshot"
        }
      },
      create: {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        kind: "package_snapshot",
        templateVersion: "transfer-package-snapshot-v1",
        referenceCode: payload.packageId,
        actorUserId: normalizeText(input.packedByUserId) ?? null,
        payload
      },
      update: {}
    });
  }

  private buildPackageSnapshotPayload(
    transfer: WarehouseTransferRecord,
    input: WarehouseTransferPackageSnapshotInput,
    packedAt: string
  ): TransferPackageSnapshotPayload {
    return {
      ...this.buildSnapshotBase(transfer),
      packageId: `PKG-${transfer.transferNumber}`,
      packageCount: Math.max(1, Math.trunc(Number(input.packageCount ?? 1))),
      packageIndex: Math.max(1, Math.trunc(Number(input.packageIndex ?? 1))),
      packedAt,
      packedByUserId: normalizeText(input.packedByUserId),
      notes: normalizeText(input.notes),
      declaredWeight:
        typeof input.declaredWeight === "number" && Number.isFinite(input.declaredWeight)
          ? input.declaredWeight
          : undefined
    };
  }

  private buildGuidePayload(
    transfer: WarehouseTransferRecord,
    input: WarehouseTransferGuideInput,
    issuedAt: string
  ): TransferGuidePayload {
    const packageSnapshot = this.findDocument(transfer, "package_snapshot");
    const packagePayload = packageSnapshot?.payload as TransferPackageSnapshotPayload | undefined;
    const guideType = input.guideType ?? "sunat_remitente";
    const transportMode = input.transportMode ?? "private";
    const number = transfer.transferNumber.replace(/^TR-/, "");

    return {
      ...this.buildSnapshotBase(transfer),
      guideType,
      series: "GRE",
      number,
      referenceCode: `GRE-${transfer.transferNumber}`,
      qrValue: transfer.transferNumber,
      motive: "traslado entre establecimientos de una misma empresa",
      transportMode,
      issuedAt,
      issuedByUserId: normalizeText(input.issuedByUserId),
      notes: normalizeText(input.notes)
        ?? (packagePayload ? `Documento derivado de ${packagePayload.packageId}.` : undefined)
    };
  }

  private buildStickerPayload(
    transfer: WarehouseTransferRecord,
    input: WarehouseTransferStickerInput,
    generatedAt: string
  ): TransferStickerPayload {
    const packageSnapshot = this.findDocument(transfer, "package_snapshot");
    const packagePayload = packageSnapshot?.payload as TransferPackageSnapshotPayload | undefined;
    const greDocument = this.findDocument(transfer, "gre");
    const grePayload = greDocument?.payload as TransferGuidePayload | undefined;

    return {
      ...this.buildSnapshotBase(transfer),
      stickerCode: `STK-${transfer.transferNumber}`,
      guideReference: grePayload?.referenceCode ?? greDocument?.referenceCode ?? undefined,
      generatedAt,
      generatedByUserId: normalizeText(input.generatedByUserId),
      printedAt: normalizeText(input.printedAt),
      printedByUserId: normalizeText(input.printedByUserId),
      notes: normalizeText(input.notes)
        ?? (packagePayload ? `Sticker derivado de ${packagePayload.packageId}.` : undefined)
    };
  }

  private buildSnapshotBase(transfer: WarehouseTransferRecord): TransferSnapshotBase {
    const lines = transfer.lines.map((line) => ({
      variantId: line.variantId,
      sku: line.skuSnapshot,
      name: line.nameSnapshot,
      quantity: line.quantity,
      dispatchedQuantity: line.dispatchedQuantity || 0,
      receivedQuantity: line.receivedQuantity || 0,
      pendingQuantity: line.quantity
    }));

    return {
      transferId: transfer.id,
      transferNumber: transfer.transferNumber,
      originWarehouseId: transfer.originWarehouseId,
      originWarehouseCode: transfer.originWarehouseCodeSnapshot,
      originWarehouseName: transfer.originWarehouseNameSnapshot,
      destinationWarehouseId: transfer.destinationWarehouseId,
      destinationWarehouseCode: transfer.destinationWarehouseCodeSnapshot,
      destinationWarehouseName: transfer.destinationWarehouseNameSnapshot,
      lineCount: lines.length,
      totalUnits: lines.reduce((sum, line) => sum + line.quantity, 0),
      lines
    };
  }

  private normalizeReceiveLines(
    transfer: WarehouseTransferRecord,
    lines: WarehouseTransferReceiveLineInput[] | undefined,
    incidentKind?: WarehouseTransferIncidentKindValue
  ) {
    const receiveCandidates = transfer.lines.map((line) => {
      const dispatchedQuantity = line.dispatchedQuantity || line.quantity;
      const remainingQuantity = Math.max(0, dispatchedQuantity - line.receivedQuantity);
      return {
        line,
        dispatchedQuantity,
        remainingQuantity
      };
    });

    if (!lines || lines.length === 0) {
      return receiveCandidates
        .filter((candidate) => candidate.remainingQuantity > 0)
        .map((candidate) => ({
          variantId: candidate.line.variantId,
          quantity: candidate.remainingQuantity
        }));
    }

    const normalized = new Map<string, number>();
    for (const line of lines) {
      const variantId = normalizeText(line.variantId);
      if (!variantId) {
        throw new BadRequestException("Cada línea de recepción requiere variantId.");
      }

      const quantity = normalizePositiveQuantity(line.quantity, `receive.${variantId}.quantity`);
      normalized.set(variantId, (normalized.get(variantId) ?? 0) + quantity);
    }

    return Array.from(normalized.entries()).map(([variantId, quantity]) => {
      const transferLine = transfer.lines.find((line) => line.variantId === variantId);
      if (!transferLine) {
        throw new ConflictException(`La variante ${variantId} no pertenece a la transferencia ${transfer.transferNumber}.`);
      }

      const dispatchedQuantity = transferLine.dispatchedQuantity || transferLine.quantity;
      const remainingQuantity = Math.max(0, dispatchedQuantity - transferLine.receivedQuantity);
      if (quantity > remainingQuantity && incidentKind !== "overage" && incidentKind !== "mixed") {
        throw new ConflictException(
          `La recepción para ${transferLine.skuSnapshot} supera el pendiente de ${remainingQuantity} unidades.`
        );
      }

      return {
        variantId,
        quantity
      };
    });
  }

  private buildIncidentSnapshot(
    transfer: WarehouseTransferRecord,
    overrides?: {
      status?: WarehouseTransferIncidentStatusValue;
      kind?: WarehouseTransferIncidentKindValue;
      notes?: string;
      openedByUserId?: string;
      resolvedByUserId?: string;
      openedAt?: string;
      resolvedAt?: string;
      resolutionNote?: string;
    }
  ): TransferIncidentPayload {
    const lines: TransferIncidentLinePayload[] = transfer.lines.map((line) => {
      const dispatchedQuantity = line.dispatchedQuantity || line.quantity;
      const receivedQuantity = line.receivedQuantity;
      const differenceQuantity = receivedQuantity - dispatchedQuantity;
      return {
        variantId: line.variantId,
        sku: line.skuSnapshot,
        name: line.nameSnapshot,
        expectedQuantity: dispatchedQuantity,
        receivedQuantity,
        differenceQuantity
      };
    });

    const totalExpectedUnits = lines.reduce((sum, line) => sum + line.expectedQuantity, 0);
    const totalReceivedUnits = lines.reduce((sum, line) => sum + line.receivedQuantity, 0);
    const totalDifferenceUnits = totalReceivedUnits - totalExpectedUnits;
    const hasOverage = lines.some((line) => line.differenceQuantity > 0);
    const hasMissing = lines.some((line) => line.differenceQuantity < 0);
    const kind =
      overrides?.kind ??
      transfer.incident?.kind ??
      (hasOverage && hasMissing
        ? "mixed"
        : hasOverage
          ? "overage"
          : hasMissing
            ? "missing"
            : "missing");

    return {
      transferId: transfer.id,
      transferNumber: transfer.transferNumber,
      status: overrides?.status ?? (transfer.incident?.status ?? "open"),
      kind,
      notes: overrides?.notes ?? transfer.incident?.notes ?? undefined,
      openedByUserId: overrides?.openedByUserId ?? transfer.incident?.openedByUserId ?? undefined,
      resolvedByUserId: overrides?.resolvedByUserId ?? transfer.incident?.resolvedByUserId ?? undefined,
      openedAt:
        overrides?.openedAt ??
        transfer.incident?.openedAt?.toISOString() ??
        transfer.partialReceivedAt?.toISOString() ??
        transfer.dispatchedAt?.toISOString() ??
        transfer.createdAt.toISOString(),
      resolvedAt: overrides?.resolvedAt ?? transfer.incident?.resolvedAt?.toISOString() ?? undefined,
      resolutionNote: overrides?.resolutionNote ?? transfer.incident?.resolutionNote ?? undefined,
      totalExpectedUnits,
      totalReceivedUnits,
      totalDifferenceUnits,
      lines
    };
  }

  private buildLogisticsSummary(record: WarehouseTransferRecord): WarehouseTransferLogisticsSummary | undefined {
    const packageSnapshot = this.findDocument(record, "package_snapshot");
    const gre = this.findDocument(record, "gre");
    const sticker = this.findDocument(record, "sticker");

    const logistics: WarehouseTransferLogisticsSummary = {};

    if (packageSnapshot) {
      logistics.packageSnapshot = this.mapPackageSnapshot(packageSnapshot);
    }

    if (gre) {
      logistics.gre = this.mapGuideSnapshot(gre);
    }

    if (sticker) {
      logistics.sticker = this.mapStickerSnapshot(sticker);
    }

    return logistics.packageSnapshot || logistics.gre || logistics.sticker ? logistics : undefined;
  }

  private buildIncidentSummary(record: WarehouseTransferRecord): WarehouseTransferIncidentSummary | undefined {
    if (!record.incident) {
      return undefined;
    }

    const payload = record.incident.payload as TransferIncidentPayload;
    return {
      id: record.incident.id,
      transferId: record.incident.transferId,
      transferNumber: record.incident.transferNumber,
      status: record.incident.status,
      kind: record.incident.kind,
      notes: record.incident.notes ?? undefined,
      openedByUserId: record.incident.openedByUserId ?? undefined,
      resolvedByUserId: record.incident.resolvedByUserId ?? undefined,
      openedAt: record.incident.openedAt.toISOString(),
      resolvedAt: record.incident.resolvedAt?.toISOString(),
      resolutionNote: record.incident.resolutionNote ?? undefined,
      totalExpectedUnits: payload.totalExpectedUnits,
      totalReceivedUnits: payload.totalReceivedUnits,
      totalDifferenceUnits: payload.totalDifferenceUnits,
      lines: payload.lines
    };
  }

  private mapPackageSnapshot(document: WarehouseTransferDocumentRecord): WarehouseTransferPackageSnapshotSummary {
    const payload = document.payload as TransferPackageSnapshotPayload;

    return {
      id: document.id,
      transferId: payload.transferId,
      transferNumber: payload.transferNumber,
      documentKind: "package_snapshot",
      templateVersion: "transfer-package-snapshot-v1",
      originWarehouseId: payload.originWarehouseId,
      originWarehouseCode: payload.originWarehouseCode,
      originWarehouseName: payload.originWarehouseName,
      destinationWarehouseId: payload.destinationWarehouseId,
      destinationWarehouseCode: payload.destinationWarehouseCode,
      destinationWarehouseName: payload.destinationWarehouseName,
      lineCount: payload.lineCount,
      totalUnits: payload.totalUnits,
      lines: payload.lines,
      packageId: payload.packageId,
      packageCount: payload.packageCount,
      packageIndex: payload.packageIndex,
      packedAt: payload.packedAt,
      packedByUserId: payload.packedByUserId,
      notes: payload.notes,
      declaredWeight: payload.declaredWeight,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString()
    };
  }

  private mapGuideSnapshot(document: WarehouseTransferDocumentRecord): WarehouseTransferGuideSummary {
    const payload = document.payload as TransferGuidePayload;

    return {
      id: document.id,
      transferId: payload.transferId,
      transferNumber: payload.transferNumber,
      documentKind: "gre",
      templateVersion: "transfer-gre-v1",
      originWarehouseId: payload.originWarehouseId,
      originWarehouseCode: payload.originWarehouseCode,
      originWarehouseName: payload.originWarehouseName,
      destinationWarehouseId: payload.destinationWarehouseId,
      destinationWarehouseCode: payload.destinationWarehouseCode,
      destinationWarehouseName: payload.destinationWarehouseName,
      lineCount: payload.lineCount,
      totalUnits: payload.totalUnits,
      lines: payload.lines,
      guideType: payload.guideType,
      series: payload.series,
      number: payload.number,
      referenceCode: payload.referenceCode,
      qrValue: payload.qrValue,
      motive: payload.motive,
      transportMode: payload.transportMode,
      issuedAt: payload.issuedAt,
      issuedByUserId: payload.issuedByUserId,
      notes: payload.notes,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString()
    };
  }

  private mapStickerSnapshot(document: WarehouseTransferDocumentRecord): WarehouseTransferStickerSummary {
    const payload = document.payload as TransferStickerPayload;

    return {
      id: document.id,
      transferId: payload.transferId,
      transferNumber: payload.transferNumber,
      documentKind: "sticker",
      templateVersion: "transfer-sticker-v1",
      originWarehouseId: payload.originWarehouseId,
      originWarehouseCode: payload.originWarehouseCode,
      originWarehouseName: payload.originWarehouseName,
      destinationWarehouseId: payload.destinationWarehouseId,
      destinationWarehouseCode: payload.destinationWarehouseCode,
      destinationWarehouseName: payload.destinationWarehouseName,
      lineCount: payload.lineCount,
      totalUnits: payload.totalUnits,
      lines: payload.lines,
      stickerCode: payload.stickerCode,
      guideReference: payload.guideReference,
      generatedAt: payload.generatedAt,
      generatedByUserId: payload.generatedByUserId,
      printedAt: payload.printedAt,
      printedByUserId: payload.printedByUserId,
      printHint: {
        paperSize: "A6",
        orientation: "portrait"
      },
      notes: payload.notes,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString()
    };
  }

  private normalizeCreateInput(input: WarehouseTransferCreateInput) {
    const originWarehouseId = normalizeText(input.originWarehouseId);
    const destinationWarehouseId = normalizeText(input.destinationWarehouseId);
    const reason = normalizeText(input.reason);

    if (!originWarehouseId) {
      throw new BadRequestException("La transferencia requiere originWarehouseId.");
    }

    if (!destinationWarehouseId) {
      throw new BadRequestException("La transferencia requiere destinationWarehouseId.");
    }

    if (!reason) {
      throw new BadRequestException("La transferencia requiere un motivo operativo.");
    }

    if (!Array.isArray(input.lines) || input.lines.length === 0) {
      throw new BadRequestException("La transferencia requiere al menos una línea.");
    }

    const mergedLines = new Map<string, { variantId: string; quantity: number }>();
    for (const line of input.lines) {
      const variantId = normalizeText(line.variantId);
      if (!variantId) {
        throw new BadRequestException("Cada línea de transferencia requiere variantId.");
      }

      const quantity = normalizePositiveQuantity(line.quantity, `lines.${variantId}.quantity`);
      const existing = mergedLines.get(variantId);
      if (existing) {
        existing.quantity += quantity;
        continue;
      }

      mergedLines.set(variantId, {
        variantId,
        quantity
      });
    }

    return {
      originWarehouseId,
      destinationWarehouseId,
      reason,
      notes: normalizeText(input.notes),
      requestedByUserId: normalizeText(input.requestedByUserId),
      requestedAt: input.requestedAt,
      lines: Array.from(mergedLines.values())
    };
  }

  private async requireActiveWarehouse(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        status: true
      }
    });

    if (!warehouse) {
      throw new NotFoundException(`Almacén no encontrado: ${id}`);
    }

    if (warehouse.status !== "active") {
      throw new ConflictException(`El almacén ${warehouse.name} no está activo para transferencias.`);
    }

    return warehouse;
  }

  private async resolveTransferLines(lines: Array<{ variantId: string; quantity: number }>) {
    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: {
          in: lines.map((line) => line.variantId)
        }
      }
    });
    const variantsById = new Map(variants.map((variant) => [variant.id, variant] as const));

    return lines
      .map((line) => {
        const variant = variantsById.get(line.variantId);
        if (!variant) {
          throw new NotFoundException(`No encontramos la variante ${line.variantId} para la transferencia.`);
        }

        if (variant.status !== "active") {
          throw new ConflictException(`La variante ${variant.sku} no está activa para transferencia.`);
        }

        return {
          variantId: variant.id,
          sku: variant.sku,
          name: variant.name,
          quantity: line.quantity,
          dispatchedQuantity: 0,
          receivedQuantity: 0,
          pendingQuantity: line.quantity
        } satisfies WarehouseTransferLineSummary;
      })
      .sort((left, right) => left.sku.localeCompare(right.sku));
  }

  private async buildTransferNumber() {
    const latest = await this.prisma.warehouseTransfer.findFirst({
      orderBy: {
        transferNumber: "desc"
      },
      select: {
        transferNumber: true
      }
    });

    const latestSequence = latest?.transferNumber.match(/^TR-(\d+)$/)?.[1];
    const nextSequence = latestSequence ? Number(latestSequence) + 1 : 1;
    return `TR-${String(nextSequence).padStart(6, "0")}`;
  }

  private mapTransfer(record: WarehouseTransferRecord): WarehouseTransferSummary {
    const isOperationallyOpen =
      record.status === "reserved" || record.status === "in_transit" || record.status === "partial_received";
    const lines = record.lines.map((line) => ({
      variantId: line.variantId,
      sku: line.skuSnapshot,
      name: line.nameSnapshot,
      quantity: line.quantity,
      dispatchedQuantity: line.dispatchedQuantity || 0,
      receivedQuantity: line.receivedQuantity || 0,
      pendingQuantity: isOperationallyOpen
        ? Math.max(0, (line.dispatchedQuantity || line.quantity) - (line.receivedQuantity || 0))
        : 0
    }));
    const dispatchedUnits = lines.reduce((sum, line) => sum + line.dispatchedQuantity, 0);
    const receivedUnits = lines.reduce((sum, line) => sum + line.receivedQuantity, 0);
    const pendingUnits = lines.reduce((sum, line) => sum + line.pendingQuantity, 0);

    return {
      id: record.id,
      transferNumber: record.transferNumber,
      status: record.status,
      reason: record.reason,
      notes: record.notes ?? undefined,
      originWarehouseId: record.originWarehouseId,
      originWarehouseCode: record.originWarehouseCodeSnapshot,
      originWarehouseName: record.originWarehouseNameSnapshot,
      destinationWarehouseId: record.destinationWarehouseId,
      destinationWarehouseCode: record.destinationWarehouseCodeSnapshot,
      destinationWarehouseName: record.destinationWarehouseNameSnapshot,
      lineCount: lines.length,
      totalUnits: lines.reduce((sum, line) => sum + line.quantity, 0),
      dispatchedUnits,
      receivedUnits,
      pendingUnits,
      lines,
      history: this.buildHistory(record),
      requestedByUserId: record.requestedByUserId ?? undefined,
      dispatchedByUserId: record.dispatchedByUserId ?? undefined,
      receivedByUserId: record.receivedByUserId ?? undefined,
      cancelledByUserId: record.cancelledByUserId ?? undefined,
      partialReceivedByUserId: record.partialReceivedByUserId ?? undefined,
      logistics: this.buildLogisticsSummary(record),
      incident: this.buildIncidentSummary(record),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      dispatchedAt: record.dispatchedAt?.toISOString(),
      partialReceivedAt: record.partialReceivedAt?.toISOString(),
      receivedAt: record.receivedAt?.toISOString(),
      cancelledAt: record.cancelledAt?.toISOString()
    };
  }

  private buildHistory(record: WarehouseTransferRecord): WarehouseTransferHistorySummary[] {
    const history: WarehouseTransferHistorySummary[] = [
      this.createHistoryEntry(
        "reserved",
        record.createdAt.toISOString(),
        record.requestedByUserId ?? undefined,
        record.reservationNote ?? record.notes ?? undefined
      )
    ];

    if (record.dispatchedAt) {
      history.unshift(
        this.createHistoryEntry(
          "in_transit",
          record.dispatchedAt.toISOString(),
          record.dispatchedByUserId ?? undefined,
          record.dispatchNote ?? undefined
        )
      );
    }

    if (record.partialReceivedAt) {
      history.unshift(
        this.createHistoryEntry(
          "partial_received",
          record.partialReceivedAt.toISOString(),
          record.partialReceivedByUserId ?? record.receivedByUserId ?? undefined,
          record.partialReceivedNote ?? record.receiveNote ?? record.incident?.notes ?? undefined
        )
      );
    }

    if (record.receivedAt) {
      history.unshift(
        this.createHistoryEntry(
          "received",
          record.receivedAt.toISOString(),
          record.receivedByUserId ?? undefined,
          record.receiveNote ?? undefined
        )
      );
    }

    if (record.cancelledAt) {
      history.unshift(
        this.createHistoryEntry(
          "cancelled",
          record.cancelledAt.toISOString(),
          record.cancelledByUserId ?? undefined,
          record.cancelNote ?? undefined
        )
      );
    }

    return history;
  }

  private createHistoryEntry(
    status: WarehouseTransferSummary["status"],
    occurredAt: string,
    actorUserId?: string,
    note?: string
  ): WarehouseTransferHistorySummary {
    return {
      status,
      actorUserId: normalizeText(actorUserId),
      note: normalizeText(note),
      occurredAt
    };
  }
}
