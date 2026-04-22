import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type WarehouseServiceArea } from "@prisma/client";
import {
  type WarehouseServiceAreaInput,
  type WarehouseServiceAreaScopeValue,
  type WarehouseServiceAreaSummary,
  type WarehouseStatusValue,
  type WarehouseSummary,
  type WarehouseUpsertInput
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { PrismaService } from "../../prisma/prisma.service";
import { PeruUbigeoService } from "../commerce/peru-ubigeo.service";

type WarehouseRecord = Prisma.WarehouseGetPayload<{
  include: {
    serviceAreas: true;
  };
}>;

type WarehousePatchInput = Partial<WarehouseUpsertInput>;

const warehouseStatuses = new Set<WarehouseStatusValue>(["active", "inactive", "suspended"]);
const serviceAreaScopes = new Set<WarehouseServiceAreaInput["scopeType"]>([
  "department",
  "province",
  "district",
  "zone"
]);

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeCode(value?: string) {
  return normalizeText(value)?.toUpperCase();
}

function slugifyCode(value?: string) {
  const normalized = value
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || undefined;
}

function normalizeStatus(value?: string): WarehouseStatusValue {
  const normalized = normalizeText(value) as WarehouseStatusValue | undefined;
  if (!normalized || !warehouseStatuses.has(normalized)) {
    throw new BadRequestException("El estado del almacén es inválido.");
  }

  return normalized;
}

function normalizePriority(value: unknown, field: string) {
  const parsed = value == null || value === "" ? 0 : Math.trunc(Number(value));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new BadRequestException(`El campo ${field} debe ser un entero mayor o igual a cero.`);
  }

  return parsed;
}

function normalizeCoordinateValue(value: unknown, field: "latitude" | "longitude") {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new BadRequestException(`El campo ${field} debe ser numérico.`);
  }

  const min = field === "latitude" ? -90 : -180;
  const max = field === "latitude" ? 90 : 180;

  if (parsed < min || parsed > max) {
    throw new BadRequestException(
      field === "latitude"
        ? "La latitud debe estar entre -90 y 90."
        : "La longitud debe estar entre -180 y 180."
    );
  }

  return Math.round(parsed * 1_000_000) / 1_000_000;
}

function normalizeServiceAreas(input?: WarehouseServiceAreaInput[]) {
  if (input == null) {
    return undefined;
  }

  if (!Array.isArray(input)) {
    throw new BadRequestException("Las service areas deben enviarse como una lista.");
  }

  const normalized = input.map((item, index) => {
    const scopeType = normalizeText(item.scopeType) as WarehouseServiceAreaInput["scopeType"] | undefined;
    const scopeCode = normalizeCode(item.scopeCode);

    if (!scopeType || !serviceAreaScopes.has(scopeType)) {
      throw new BadRequestException(`El scopeType de la service area ${index + 1} es inválido.`);
    }

    if (!scopeCode) {
      throw new BadRequestException(`La service area ${index + 1} necesita scopeCode.`);
    }

    return {
      scopeType,
      scopeCode,
      priority: normalizePriority(item.priority, `serviceAreas.${index}.priority`),
      isActive: item.isActive ?? true
    };
  });

  const duplicate = normalized.find(
    (area, index) =>
      normalized.findIndex(
        (candidate) => candidate.scopeType === area.scopeType && candidate.scopeCode === area.scopeCode
      ) !== index
  );

  if (duplicate) {
    throw new BadRequestException(
      `La service area ${duplicate.scopeType}:${duplicate.scopeCode} está duplicada en la misma solicitud.`
    );
  }

  return normalized;
}

function sortServiceAreas(serviceAreas: WarehouseServiceArea[]) {
  return serviceAreas.slice().sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    if (left.scopeType !== right.scopeType) {
      return left.scopeType.localeCompare(right.scopeType);
    }

    return left.scopeCode.localeCompare(right.scopeCode);
  });
}

@Injectable()
export class WarehousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly peruUbigeoService: PeruUbigeoService
  ) {}

  async listWarehouses() {
    const warehouses = await this.prisma.warehouse.findMany({
      include: {
        serviceAreas: true
      },
      orderBy: [{ status: "asc" }, { priority: "asc" }, { name: "asc" }]
    });

    const mapped = warehouses.map((warehouse) => this.mapWarehouse(warehouse));
    return wrapResponse(mapped, {
      total: mapped.length,
      active: mapped.filter((warehouse) => warehouse.status === "active").length
    });
  }

  async getWarehouse(id: string) {
    const warehouse = await this.findWarehouse(id);
    return warehouse ? wrapResponse(this.mapWarehouse(warehouse), { found: true }) : null;
  }

  async createWarehouse(body: WarehouseUpsertInput) {
    const input = this.normalizeCreateInput(body);

    try {
      const warehouse = await this.prisma.$transaction(async (tx) => {
        const code = await this.resolveWarehouseCode(
          {
            code: input.code,
            name: input.name,
            districtCode: input.districtCode
          },
          tx
        );

        const created = await tx.warehouse.create({
          data: {
            code,
            name: input.name,
            status: input.status,
            priority: input.priority,
            countryCode: input.countryCode,
            addressLine1: input.addressLine1,
            addressLine2: input.addressLine2 ?? null,
            reference: input.reference ?? null,
            departmentCode: input.departmentCode,
            departmentName: input.departmentName ?? null,
            provinceCode: input.provinceCode,
            provinceName: input.provinceName ?? null,
            districtCode: input.districtCode,
            districtName: input.districtName ?? null,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null
          }
        });

        if (input.serviceAreas?.length) {
          await tx.warehouseServiceArea.createMany({
            data: input.serviceAreas.map((area) => ({
              warehouseId: created.id,
              scopeType: area.scopeType,
              scopeCode: area.scopeCode,
              priority: area.priority,
              isActive: area.isActive
            }))
          });
        }

        return tx.warehouse.findUniqueOrThrow({
          where: { id: created.id },
          include: { serviceAreas: true }
        });
      });

      return {
        ...actionResponse("ok", "El almacén fue creado correctamente.", warehouse.id),
        warehouse: this.mapWarehouse(warehouse)
      };
    } catch (error) {
      return this.rethrowWarehouseError(error, "No pudimos crear el almacén.");
    }
  }

  async patchWarehouse(id: string, body: WarehousePatchInput) {
    const input = this.normalizePatchInput(body);

    try {
      const warehouse = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.warehouse.findUnique({
          where: { id },
          include: {
            serviceAreas: true
          }
        });

        if (!existing) {
          throw new NotFoundException(`Almacén no encontrado: ${id}`);
        }

        const resolvedCode =
          input.code === undefined
            ? existing.code
            : await this.resolveWarehouseCode(
                {
                  code: input.code,
                  name: input.name ?? existing.name,
                  districtCode: input.districtCode ?? existing.districtCode
                },
                tx,
                existing.id
              );

        if (resolvedCode !== existing.code) {
          const duplicate = await tx.warehouse.findUnique({
            where: { code: resolvedCode }
          });

          if (duplicate && duplicate.id !== existing.id) {
            throw new ConflictException(`Ya existe un almacén con el código ${resolvedCode}.`);
          }
        }

        const nextStatus = input.status ?? (existing.status as WarehouseStatusValue);
        if (nextStatus !== "active") {
          const activeVariants = await tx.productVariant.count({
            where: {
              defaultWarehouseId: existing.id,
              status: "active"
            }
          });

          if (activeVariants > 0) {
            throw new ConflictException(
              "No puedes desactivar un almacén que sigue asignado como default en variantes activas."
            );
          }
        }

        const ubigeo = this.resolveWarehouseUbigeo({
          departmentCode: input.departmentCode ?? existing.departmentCode,
          provinceCode: input.provinceCode ?? existing.provinceCode,
          districtCode: input.districtCode ?? existing.districtCode
        });
        const coordinates = this.resolveCoordinates({
          latitude: input.latitude === undefined ? existing.latitude : input.latitude,
          longitude: input.longitude === undefined ? existing.longitude : input.longitude
        });

        const nextServiceAreas =
          input.serviceAreas !== undefined ? normalizeServiceAreas(input.serviceAreas) : undefined;

        await tx.warehouse.update({
          where: { id: existing.id },
          data: {
            code: resolvedCode,
            name: input.name ?? existing.name,
            status: nextStatus,
            priority: input.priority ?? existing.priority,
            countryCode: "PE",
            addressLine1: input.addressLine1 ?? existing.addressLine1,
            addressLine2: input.addressLine2 === undefined ? existing.addressLine2 : input.addressLine2 ?? null,
            reference: input.reference === undefined ? existing.reference : input.reference ?? null,
            departmentCode: ubigeo.departmentCode,
            departmentName: ubigeo.departmentName,
            provinceCode: ubigeo.provinceCode,
            provinceName: ubigeo.provinceName,
            districtCode: ubigeo.districtCode,
            districtName: ubigeo.districtName,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
          }
        });

        if (nextServiceAreas !== undefined) {
          await tx.warehouseServiceArea.deleteMany({
            where: { warehouseId: existing.id }
          });

          if (nextServiceAreas.length) {
            await tx.warehouseServiceArea.createMany({
              data: nextServiceAreas.map((area) => ({
                warehouseId: existing.id,
                scopeType: area.scopeType,
                scopeCode: area.scopeCode,
                priority: area.priority,
                isActive: area.isActive
              }))
            });
          }
        }

        return tx.warehouse.findUniqueOrThrow({
          where: { id: existing.id },
          include: {
            serviceAreas: true
          }
        });
      });

      return {
        ...actionResponse("ok", "El almacén fue actualizado correctamente.", warehouse.id),
        warehouse: this.mapWarehouse(warehouse)
      };
    } catch (error) {
      return this.rethrowWarehouseError(error, "No pudimos actualizar el almacén.");
    }
  }

  async deleteWarehouse(id: string) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const existing = await tx.warehouse.findUnique({
          where: { id },
          select: { id: true, name: true }
        });

        if (!existing) {
          throw new NotFoundException(`Almacén no encontrado: ${id}`);
        }

        const [
          defaultVariants,
          inventoryBalances,
          inventoryMovements,
          fulfillmentAssignments,
          originTransfers,
          destinationTransfers
        ] = await Promise.all([
          tx.productVariant.count({
            where: { defaultWarehouseId: existing.id }
          }),
          tx.warehouseInventoryBalance.count({
            where: { warehouseId: existing.id }
          }),
          tx.inventoryMovement.count({
            where: { warehouseId: existing.id }
          }),
          tx.orderFulfillmentAssignment.count({
            where: { warehouseId: existing.id }
          }),
          tx.warehouseTransfer.count({
            where: { originWarehouseId: existing.id }
          }),
          tx.warehouseTransfer.count({
            where: { destinationWarehouseId: existing.id }
          })
        ]);

        const blockers = [
          defaultVariants > 0 ? `${defaultVariants} variante(s) lo usan como almacén preferido` : undefined,
          inventoryBalances > 0 ? `${inventoryBalances} saldo(s) de inventario por almacén` : undefined,
          inventoryMovements > 0 ? `${inventoryMovements} movimiento(s) de inventario histórico` : undefined,
          fulfillmentAssignments > 0 ? `${fulfillmentAssignments} asignación(es) de pedidos` : undefined,
          originTransfers > 0 ? `${originTransfers} traslado(s) de salida` : undefined,
          destinationTransfers > 0 ? `${destinationTransfers} traslado(s) de entrada` : undefined
        ].filter((item): item is string => Boolean(item));

        if (blockers.length) {
          throw new ConflictException(
            `No puedes eliminar ${existing.name} porque tiene ${blockers.join(", ")}. Suspéndelo para sacarlo de operación sin perder historial.`
          );
        }

        await tx.warehouse.delete({
          where: { id: existing.id }
        });
      });

      return actionResponse("ok", "El almacén fue eliminado correctamente.", id);
    } catch (error) {
      return this.rethrowWarehouseError(error, "No pudimos eliminar el almacén.");
    }
  }

  private normalizeCreateInput(body: WarehouseUpsertInput) {
    const name = normalizeText(body.name);
    const addressLine1 = normalizeText(body.addressLine1);
    const departmentCode = normalizeText(body.departmentCode);
    const provinceCode = normalizeText(body.provinceCode);
    const districtCode = normalizeText(body.districtCode);

    if (!name) {
      throw new BadRequestException("El nombre del almacén es obligatorio.");
    }

    if (!addressLine1) {
      throw new BadRequestException("La dirección principal del almacén es obligatoria.");
    }

    if (!departmentCode || !provinceCode || !districtCode) {
      throw new BadRequestException("El ubigeo del almacén es obligatorio.");
    }

    const ubigeo = this.resolveWarehouseUbigeo({
      departmentCode,
      provinceCode,
      districtCode
    });
    const coordinates = this.resolveCoordinates({
      latitude: normalizeCoordinateValue(body.latitude, "latitude"),
      longitude: normalizeCoordinateValue(body.longitude, "longitude")
    });

    return {
      code: normalizeCode(body.code),
      name,
      status: normalizeStatus(body.status),
      priority: normalizePriority(body.priority, "priority"),
      countryCode: "PE",
      addressLine1,
      addressLine2: normalizeText(body.addressLine2),
      reference: normalizeText(body.reference),
      departmentCode: ubigeo.departmentCode,
      departmentName: ubigeo.departmentName,
      provinceCode: ubigeo.provinceCode,
      provinceName: ubigeo.provinceName,
      districtCode: ubigeo.districtCode,
      districtName: ubigeo.districtName,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      serviceAreas: normalizeServiceAreas(body.serviceAreas)
    };
  }

  private normalizePatchInput(body: WarehousePatchInput) {
    if (body.status !== undefined) {
      normalizeStatus(body.status);
    }

    if (body.priority !== undefined) {
      normalizePriority(body.priority, "priority");
    }

    if (body.serviceAreas !== undefined) {
      normalizeServiceAreas(body.serviceAreas);
    }

    return {
      code: body.code === undefined ? undefined : normalizeCode(body.code),
      name: body.name === undefined ? undefined : normalizeText(body.name),
      status: body.status === undefined ? undefined : normalizeStatus(body.status),
      priority: body.priority === undefined ? undefined : normalizePriority(body.priority, "priority"),
      countryCode: body.countryCode === undefined ? undefined : "PE",
      addressLine1: body.addressLine1 === undefined ? undefined : normalizeText(body.addressLine1),
      addressLine2: body.addressLine2 === undefined ? undefined : normalizeText(body.addressLine2),
      reference: body.reference === undefined ? undefined : normalizeText(body.reference),
      departmentCode: body.departmentCode === undefined ? undefined : normalizeText(body.departmentCode),
      departmentName: undefined,
      provinceCode: body.provinceCode === undefined ? undefined : normalizeText(body.provinceCode),
      provinceName: undefined,
      districtCode: body.districtCode === undefined ? undefined : normalizeText(body.districtCode),
      districtName: undefined,
      latitude: normalizeCoordinateValue(body.latitude, "latitude"),
      longitude: normalizeCoordinateValue(body.longitude, "longitude"),
      serviceAreas: body.serviceAreas === undefined ? undefined : normalizeServiceAreas(body.serviceAreas)
    };
  }

  private resolveCoordinates(input: {
    latitude?: number | null;
    longitude?: number | null;
  }) {
    const latitude = input.latitude ?? null;
    const longitude = input.longitude ?? null;

    if ((latitude == null) !== (longitude == null)) {
      throw new BadRequestException("Debes registrar latitud y longitud juntas, o dejar ambas vacías.");
    }

    return {
      latitude,
      longitude
    };
  }

  private resolveWarehouseUbigeo(input: {
    departmentCode?: string;
    provinceCode?: string;
    districtCode?: string;
  }) {
    return this.peruUbigeoService.resolveSelection({
      departmentCode: input.departmentCode,
      provinceCode: input.provinceCode,
      districtCode: input.districtCode
    });
  }

  private async resolveWarehouseCode(
    input: {
      code?: string;
      name: string;
      districtCode: string;
    },
    tx: Prisma.TransactionClient,
    currentWarehouseId?: string
  ) {
    const explicitCode = normalizeCode(input.code);
    if (explicitCode) {
      return explicitCode;
    }

    const baseSegments = [
      "WH",
      slugifyCode(input.name)?.split("-").slice(0, 2).join("-"),
      input.districtCode
    ].filter((value): value is string => Boolean(value));

    const baseCode = baseSegments.join("-");
    let candidate = baseCode;
    let suffix = 2;

    while (true) {
      const existing = await tx.warehouse.findUnique({
        where: { code: candidate },
        select: { id: true }
      });

      if (!existing || existing.id === currentWarehouseId) {
        return candidate;
      }

      candidate = `${baseCode}-${suffix}`;
      suffix += 1;
    }
  }

  private async findWarehouse(id: string) {
    return this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        serviceAreas: true
      }
    });
  }

  private mapServiceArea(serviceArea: WarehouseServiceArea): WarehouseServiceAreaSummary {
    return {
      id: serviceArea.id,
      warehouseId: serviceArea.warehouseId,
      scopeType: serviceArea.scopeType as WarehouseServiceAreaScopeValue,
      scopeCode: serviceArea.scopeCode,
      scopeLabel: this.peruUbigeoService.describeServiceArea(
        serviceArea.scopeType as WarehouseServiceAreaScopeValue,
        serviceArea.scopeCode
      ),
      priority: serviceArea.priority,
      isActive: serviceArea.isActive
    };
  }

  private mapWarehouse(warehouse: WarehouseRecord): WarehouseSummary {
    return {
      id: warehouse.id,
      code: warehouse.code,
      name: warehouse.name,
      status: warehouse.status as WarehouseStatusValue,
      priority: warehouse.priority,
      countryCode: warehouse.countryCode,
      addressLine1: warehouse.addressLine1,
      addressLine2: warehouse.addressLine2 ?? undefined,
      reference: warehouse.reference ?? undefined,
      departmentCode: warehouse.departmentCode,
      departmentName: warehouse.departmentName ?? undefined,
      provinceCode: warehouse.provinceCode,
      provinceName: warehouse.provinceName ?? undefined,
      districtCode: warehouse.districtCode,
      districtName: warehouse.districtName ?? undefined,
      latitude: warehouse.latitude ?? undefined,
      longitude: warehouse.longitude ?? undefined,
      serviceAreas: sortServiceAreas(warehouse.serviceAreas).map((serviceArea) => this.mapServiceArea(serviceArea))
    };
  }

  private rethrowWarehouseError(error: unknown, fallbackMessage: string): never {
    if (error instanceof NotFoundException || error instanceof ConflictException) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException("Ya existe un almacén con un identificador único duplicado.");
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new ConflictException(
        "No puedes eliminar este almacén porque todavía tiene registros operativos relacionados."
      );
    }

    if (error instanceof Error) {
      throw new BadRequestException(`${fallbackMessage} ${error.message}`);
    }

    throw new BadRequestException(fallbackMessage);
  }
}
