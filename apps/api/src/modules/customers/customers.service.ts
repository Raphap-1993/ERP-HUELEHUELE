import { createHash, randomBytes, scryptSync } from "node:crypto";
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, forwardRef } from "@nestjs/common";
import { CustomerIdentityConflictStatus, CustomerMergeStatus, LifecycleStatus, Prisma } from "@prisma/client";
import {
  CHECKOUT_DOCUMENT_TYPE_OPTIONS,
  type CheckoutDocumentType,
  type CheckoutCustomerPrefillSummary,
  RoleCode,
  type AdminOrderSummary,
  type CustomerConflictCandidateSummary,
  type CustomerConflictResolveInput,
  type CustomerIdentityConflictSummary,
  type CustomerAddressInput,
  type CustomerAddressSummary,
  type CustomerDetail,
  type CustomerMergeInput,
  type CustomerStatusValue,
  type CustomerSummary,
  type CustomerUpsertInput
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { ModuleStateService } from "../../persistence/module-state.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { OrdersService } from "../orders/orders.service";

type CustomerRecord = Prisma.CustomerGetPayload<{
  include: {
    user: true;
    addresses: true;
    loyaltyAccount: true;
    mergedIntoCustomer: true;
    mergedCustomers: true;
  };
}>;

type UserRecord = Prisma.UserGetPayload<{
  include: {
    roles: true;
    customer: {
      include: {
        user: true;
        addresses: true;
        loyaltyAccount: true;
        mergedIntoCustomer: true;
        mergedCustomers: true;
      };
    };
  };
}>;

type CustomerConflictRecord = Prisma.CustomerIdentityConflictGetPayload<{
  include: {
    resolvedCustomer: {
      include: {
        user: true;
        addresses: true;
        loyaltyAccount: true;
        mergedIntoCustomer: true;
        mergedCustomers: true;
      };
    };
  };
}>;

type OrderSnapshotAddressRecord = {
  label?: string;
  recipientName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
  departmentCode?: string;
  departmentName?: string;
  provinceCode?: string;
  provinceName?: string;
  districtCode?: string;
  districtName?: string;
};

type NormalizedCustomerAddress = {
  label: string;
  recipientName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  departmentCode?: string;
  departmentName?: string;
  provinceCode?: string;
  provinceName?: string;
  districtCode?: string;
  districtName?: string;
};

type OrderSnapshotRecord = {
  orderNumber: string;
  customerId?: string;
  customerConflictId?: string;
  customerName?: string;
  total: number;
  currencyCode: string;
  orderStatus: AdminOrderSummary["orderStatus"];
  paymentStatus: AdminOrderSummary["paymentStatus"];
  paymentMethod: AdminOrderSummary["paymentMethod"];
  salesChannel: AdminOrderSummary["salesChannel"];
  vendorId?: string;
  vendorCode?: string;
  vendorName?: string;
  manualStatus?: AdminOrderSummary["manualStatus"];
  crmStage?: AdminOrderSummary["crmStage"];
  providerReference: string;
  confirmedAt?: string;
  updatedAt: string;
  createdAt: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    documentType?: CheckoutDocumentType;
    documentNumber?: string;
  };
  address?: OrderSnapshotAddressRecord;
  items?: Array<unknown>;
};

type OrdersSnapshot = {
  orders?: OrderSnapshotRecord[];
};

const roleLabels: Record<RoleCode, string> = {
  [RoleCode.SuperAdmin]: "Super Admin",
  [RoleCode.Admin]: "Admin",
  [RoleCode.OperadorPagos]: "Operador de pagos",
  [RoleCode.Ventas]: "Ventas",
  [RoleCode.Marketing]: "Marketing",
  [RoleCode.SellerManager]: "Seller Manager",
  [RoleCode.Vendedor]: "Vendedor",
  [RoleCode.Mayorista]: "Mayorista",
  [RoleCode.Cliente]: "Cliente"
};
const customerDocumentTypes = new Set<CheckoutDocumentType>(CHECKOUT_DOCUMENT_TYPE_OPTIONS.map((option) => option.value));
const syntheticCustomerEmailDomain = "customers.huelegood.local";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isSyntheticCustomerEmail(value?: string | null) {
  return Boolean(value?.trim().toLowerCase().endsWith(`@${syntheticCustomerEmailDomain}`));
}

function normalizePhone(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized.replace(/\s+/g, "") : undefined;
}

function normalizeDocumentType(value?: CheckoutDocumentType | null): CheckoutDocumentType | undefined {
  return value && customerDocumentTypes.has(value) ? value : undefined;
}

function normalizeDocumentNumber(value?: string | null, documentType?: CheckoutDocumentType) {
  const raw = value?.trim().toUpperCase();
  if (!raw) {
    return undefined;
  }

  const normalized = documentType === "dni" || documentType === "ruc" ? raw.replace(/\D/g, "") : raw.replace(/[^0-9A-Z-]/g, "");
  return normalized ? normalized : undefined;
}

function normalizeName(firstName?: string, lastName?: string, fallback?: string) {
  const composed = [firstName, lastName].map((part) => normalizeText(part)).filter(Boolean).join(" ");
  return composed || normalizeText(fallback) || undefined;
}

function normalizeIdentityText(value?: string | null) {
  return value
    ?.trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function splitFullName(value?: string) {
  const parts = normalizeText(value)?.split(/\s+/) ?? [];
  if (parts.length === 0) {
    return {
      firstName: "Cliente",
      lastName: "Huelegood"
    };
  }

  return {
    firstName: parts[0] ?? "Cliente",
    lastName: parts.slice(1).join(" ")
  };
}

function buildDocumentIdentityKey(documentType?: CheckoutDocumentType, documentNumber?: string) {
  return documentType && documentNumber ? `doc:${documentType}:${documentNumber}` : undefined;
}

function buildPhoneNameIdentityKey(phone?: string, fullName?: string) {
  const normalizedName = normalizeIdentityText(fullName);
  return phone && normalizedName ? `phone-name:${phone}:${normalizedName}` : undefined;
}

function buildNameAddressIdentityKey(fullName?: string, address?: OrderSnapshotAddressRecord) {
  const normalizedName = normalizeIdentityText(fullName);
  const line1 = normalizeIdentityText(address?.line1);
  const city = normalizeIdentityText(address?.city);
  const region = normalizeIdentityText(address?.region);
  const countryCode = normalizeText(address?.countryCode)?.toUpperCase();

  if (!normalizedName || !line1 || !city || !region) {
    return undefined;
  }

  return `name-address:${normalizedName}:${line1}:${city}:${region}:${countryCode ?? "PE"}`;
}

function buildSyntheticCustomerEmail(identityKey: string) {
  const suffix = createHash("sha1").update(identityKey).digest("hex").slice(0, 18);
  return `guest+${suffix}@${syntheticCustomerEmailDomain}`;
}

function toCustomerStatus(status: LifecycleStatus): CustomerStatusValue {
  return status as CustomerStatusValue;
}

function toLifecycleStatus(status?: CustomerStatusValue) {
  if (!status) {
    return LifecycleStatus.active;
  }

  return status as LifecycleStatus;
}

function sortAddresses(addresses: CustomerRecord["addresses"]) {
  return addresses.slice().sort((left, right) => {
    if (left.isDefault && !right.isDefault) {
      return -1;
    }

    if (!left.isDefault && right.isDefault) {
      return 1;
    }

    return left.createdAt.getTime() - right.createdAt.getTime();
  });
}

function toAddressSummary(address: CustomerRecord["addresses"][number]): CustomerAddressSummary {
  return {
    id: address.id,
    label: address.label,
    recipientName: address.recipientName,
    line1: address.line1,
    line2: address.line2 ?? undefined,
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    countryCode: address.countryCode,
    departmentCode: address.departmentCode ?? undefined,
    departmentName: address.departmentName ?? undefined,
    provinceCode: address.provinceCode ?? undefined,
    provinceName: address.provinceName ?? undefined,
    districtCode: address.districtCode ?? undefined,
    districtName: address.districtName ?? undefined,
    isDefault: address.isDefault
  };
}

function toOrderSummary(order: OrderSnapshotRecord): AdminOrderSummary {
  const customerName = normalizeText(order.customerName) ?? normalizeName(order.customer?.firstName, order.customer?.lastName, order.orderNumber) ?? order.orderNumber;

  return {
    orderNumber: order.orderNumber,
    customerName,
    total: order.total,
    currencyCode: order.currencyCode,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    salesChannel: order.salesChannel,
    vendorId: order.vendorId,
    vendorCode: order.vendorCode,
    vendorName: order.vendorName,
    manualStatus: order.manualStatus,
    crmStage: order.crmStage,
    providerReference: order.providerReference,
    confirmedAt: order.confirmedAt,
    updatedAt: order.updatedAt,
    createdAt: order.createdAt,
    itemCount: order.items?.length ?? 0
  };
}

function summarizeDefaultAddress(address?: CustomerAddressSummary) {
  if (!address) {
    return undefined;
  }

  return [address.city, address.region].filter(Boolean).join(" · ");
}

function hasAddressContent(address: CustomerAddressInput) {
  return Boolean(
    normalizeText(address.line1) ||
      normalizeText(address.city) ||
      normalizeText(address.region) ||
      normalizeText(address.postalCode) ||
      normalizeText(address.recipientName)
  );
}

function orderAddressFingerprint(address: OrderSnapshotAddressRecord) {
  return [
    normalizeIdentityText(address.line1),
    normalizeIdentityText(address.line2),
    normalizeIdentityText(address.districtName),
    normalizeIdentityText(address.city),
    normalizeIdentityText(address.provinceName),
    normalizeIdentityText(address.region),
    normalizeIdentityText(address.departmentName),
    normalizeIdentityText(address.postalCode),
    normalizeText(address.countryCode)?.toUpperCase() ?? "PE"
  ]
    .filter(Boolean)
    .join("|");
}

type NormalizedOrderCustomer = {
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  persistedEmail: string;
  phone?: string;
  documentType?: CheckoutDocumentType;
  documentNumber?: string;
  documentIdentityKey?: string;
  phoneNameIdentityKey?: string;
  nameAddressIdentityKey?: string;
  address?: NormalizedCustomerAddress;
};

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly moduleStateService: ModuleStateService,
    @Inject(forwardRef(() => OrdersService)) private readonly ordersService: OrdersService
  ) {}

  async listCustomers() {
    const [records, orders, openConflicts] = await Promise.all([
      this.prisma.customer.findMany({
        where: {
          mergeStatus: CustomerMergeStatus.active
        },
        include: {
          user: true,
          addresses: true,
          loyaltyAccount: true,
          mergedIntoCustomer: true,
          mergedCustomers: true
        },
        orderBy: {
          updatedAt: "desc"
        }
      }),
      this.loadOrders(),
      this.prisma.customerIdentityConflict.count({
        where: {
          status: CustomerIdentityConflictStatus.open
        }
      })
    ]);

    const customers = records.map((record) => this.toCustomerSummary(record, this.matchingOrders(record, orders)));

    return wrapResponse(customers, {
      total: customers.length,
      active: customers.filter((customer) => customer.status === "active").length,
      withOrders: customers.filter((customer) => customer.ordersCount > 0).length,
      openConflicts
    });
  }

  async getCustomer(id: string) {
    const record = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: true,
        addresses: true,
        loyaltyAccount: true,
        mergedIntoCustomer: true,
        mergedCustomers: true
      }
    });

    if (!record) {
      return null;
    }

    return this.toCustomerDetail(record, this.matchingOrders(record, await this.loadOrders()));
  }

  async findCheckoutPrefillByDocument(
    documentType?: CheckoutDocumentType,
    documentNumber?: string
  ): Promise<CheckoutCustomerPrefillSummary | undefined> {
    const normalizedDocumentType = normalizeDocumentType(documentType);
    const normalizedDocumentNumber = normalizeDocumentNumber(documentNumber, normalizedDocumentType);

    if (!normalizedDocumentType || !normalizedDocumentNumber) {
      return undefined;
    }

    const record = await this.prisma.customer.findFirst({
      where: {
        documentType: normalizedDocumentType,
        documentNumber: normalizedDocumentNumber
      },
      include: {
        user: true,
        addresses: true,
        loyaltyAccount: true,
        mergedIntoCustomer: true,
        mergedCustomers: true
      }
    });

    if (!record) {
      return undefined;
    }

    const activeRecord = await this.resolveActiveCustomerRecord(record);
    const defaultAddress = sortAddresses(activeRecord.addresses)[0];

    return {
      id: activeRecord.id,
      firstName: activeRecord.firstName,
      lastName: activeRecord.lastName,
      fullName: `${activeRecord.firstName} ${activeRecord.lastName}`.trim(),
      email: isSyntheticCustomerEmail(activeRecord.user.email) ? undefined : activeRecord.user.email,
      phone: activeRecord.user.phone ?? undefined,
      documentType: normalizeDocumentType(activeRecord.documentType as CheckoutDocumentType | null | undefined),
      documentNumber: activeRecord.documentNumber ?? undefined,
      defaultAddress: defaultAddress
        ? {
            line1: defaultAddress.line1,
            line2: defaultAddress.line2 ?? undefined,
            city: defaultAddress.city,
            region: defaultAddress.region,
            postalCode: defaultAddress.postalCode,
            countryCode: defaultAddress.countryCode,
            departmentCode: defaultAddress.departmentCode ?? undefined,
            departmentName: defaultAddress.departmentName ?? undefined,
            provinceCode: defaultAddress.provinceCode ?? undefined,
            provinceName: defaultAddress.provinceName ?? undefined,
            districtCode: defaultAddress.districtCode ?? undefined,
            districtName: defaultAddress.districtName ?? undefined
          }
        : undefined
    };
  }

  async createCustomer(input: CustomerUpsertInput) {
    const email = this.requireEmail(input.email);
    const password = this.requirePassword(input.password);
    const phone = normalizePhone(input.phone);
    const document = this.normalizeCustomerDocumentInput(input);
    const status = toLifecycleStatus(input.status);

    await this.assertUniqueUserFields({ email, phone });
    await this.assertUniqueCustomerDocument(document);
    const role = await this.ensureCustomerRole();
    const addresses = this.normalizeAddresses(input.addresses ?? [], input);

    const created = await this.prisma.user.create({
      data: {
        email,
        phone,
        passwordHash: hashPassword(password),
        status,
        roles: {
          create: [
            {
              roleId: role.id
            }
          ]
        },
        customer: {
          create: {
            firstName: this.requireName(input.firstName, "El nombre del cliente es obligatorio."),
            lastName: this.requireName(input.lastName, "El apellido del cliente es obligatorio."),
            documentType: document.documentType,
            documentNumber: document.documentNumber,
            marketingOptIn: input.marketingOptIn === true,
            status,
            addresses: addresses.length
              ? {
                  create: addresses
                }
              : undefined
          }
        }
      },
      include: {
        customer: {
          include: {
            user: true,
            addresses: true,
            loyaltyAccount: true,
            mergedIntoCustomer: true,
            mergedCustomers: true
          }
        }
      }
    });

    const customer = created.customer;
    if (!customer) {
      throw new BadRequestException("No pudimos crear el perfil del cliente.");
    }

    this.auditService.recordAdminAction({
      actionType: "customers.created",
      targetType: "customer",
      targetId: customer.id,
      summary: `Cliente ${customer.firstName} ${customer.lastName} creado desde backoffice.`,
      metadata: {
        email,
        marketingOptIn: input.marketingOptIn === true
      }
    });

    return wrapResponse(await this.toCustomerDetailWithOrders(customer), {
      created: true
    });
  }

  async updateCustomer(id: string, input: CustomerUpsertInput) {
    const existing = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: true,
        addresses: true,
        loyaltyAccount: true,
        mergedIntoCustomer: true,
        mergedCustomers: true
      }
    });

    if (!existing) {
      throw new BadRequestException("No encontramos el cliente solicitado.");
    }

    if (existing.mergeStatus === CustomerMergeStatus.merged) {
      throw new ConflictException("No puedes editar un cliente fusionado. Edita el cliente canónico.");
    }

    const email = this.requireEmail(input.email);
    const phone = normalizePhone(input.phone);
    const document = this.normalizeCustomerDocumentInput(input);

    await this.assertUniqueUserFields({
      email,
      phone,
      exceptUserId: existing.userId
    });
    await this.assertUniqueCustomerDocument(document, existing.id);

    const status = toLifecycleStatus(input.status);
    const addresses = input.addresses ? this.normalizeAddresses(input.addresses, input) : null;
    const nextPassword = normalizeText(input.password);

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        firstName: this.requireName(input.firstName, "El nombre del cliente es obligatorio."),
        lastName: this.requireName(input.lastName, "El apellido del cliente es obligatorio."),
        documentType: document.documentType ?? null,
        documentNumber: document.documentNumber ?? null,
        marketingOptIn: input.marketingOptIn === true,
        status,
        addresses:
          addresses == null
            ? undefined
            : {
                deleteMany: {},
                create: addresses
              },
        user: {
          update: {
            email,
            phone: phone ?? null,
            status,
            passwordHash: nextPassword ? hashPassword(nextPassword) : undefined
          }
        }
      },
      include: {
        user: true,
        addresses: true,
        loyaltyAccount: true,
        mergedIntoCustomer: true,
        mergedCustomers: true
      }
    });

    this.auditService.recordAdminAction({
      actionType: "customers.updated",
      targetType: "customer",
      targetId: updated.id,
      summary: `Cliente ${updated.firstName} ${updated.lastName} actualizado desde backoffice.`,
      metadata: {
        email,
        marketingOptIn: updated.marketingOptIn,
        addressesReplaced: addresses != null
      }
    });

    return wrapResponse(await this.toCustomerDetailWithOrders(updated), {
      updated: true
    });
  }

  async deleteCustomer(id: string) {
    const [existing, orders] = await Promise.all([
      this.prisma.customer.findUnique({
        where: { id },
        include: {
          user: {
            include: {
              admin: true,
              vendor: true
            }
          },
          mergedCustomers: true
        }
      }),
      this.loadOrders()
    ]);

    if (!existing) {
      throw new BadRequestException("No encontramos el cliente solicitado.");
    }

    if (existing.mergeStatus === CustomerMergeStatus.merged) {
      throw new ConflictException("No podemos eliminar un cliente ya fusionado.");
    }

    if (existing.mergedCustomers.length > 0) {
      throw new ConflictException("No podemos eliminar este cliente porque ya es el destino canónico de una fusión.");
    }

    if (existing.user.admin || existing.user.vendor) {
      throw new ConflictException("No podemos eliminar este cliente porque la misma cuenta también cumple otro rol operativo.");
    }

    if (orders.some((order) => order.customerId === id)) {
      throw new ConflictException("No podemos eliminar este cliente porque todavía está asociado a pedidos operativos.");
    }

    await this.prisma.user.delete({
      where: {
        id: existing.userId
      }
    });

    this.auditService.recordAdminAction({
      actionType: "customers.deleted",
      targetType: "customer",
      targetId: id,
      summary: `Cliente ${existing.firstName} ${existing.lastName} eliminado desde backoffice.`,
      metadata: {
        email: existing.user.email
      }
    });

    return actionResponse("ok", "Cliente eliminado correctamente.", id);
  }

  async listCustomerConflicts() {
    const [records, orders] = await Promise.all([
      this.prisma.customerIdentityConflict.findMany({
        include: {
          resolvedCustomer: {
            include: {
              user: true,
              addresses: true,
              loyaltyAccount: true,
              mergedIntoCustomer: true,
              mergedCustomers: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      this.loadOrders()
    ]);

    const candidateIds = records.flatMap((record) => record.candidateCustomerIds);
    const candidates = await this.loadCustomerRecordsByIds(candidateIds);
    const conflicts = records.map((record) => this.toCustomerConflictSummary(record, candidates, orders));

    return wrapResponse(conflicts, {
      total: conflicts.length,
      open: conflicts.filter((conflict) => conflict.status === "open").length,
      resolved: conflicts.filter((conflict) => conflict.status === "resolved").length,
      merged: conflicts.filter((conflict) => conflict.status === "merged").length
    });
  }

  async resolveCustomerConflict(id: string, input: CustomerConflictResolveInput) {
    const conflict = await this.requireCustomerConflict(id);
    if (conflict.status === CustomerIdentityConflictStatus.resolved || conflict.status === CustomerIdentityConflictStatus.merged) {
      throw new ConflictException("Este conflicto ya fue resuelto.");
    }

    if (input.action === "ignore") {
      await this.prisma.customerIdentityConflict.update({
        where: { id: conflict.id },
        data: {
          status: CustomerIdentityConflictStatus.ignored,
          resolutionType: "ignore",
          resolutionNotes: normalizeText(input.notes),
          resolvedAt: new Date()
        }
      });

      await this.ordersService.applyCustomerResolution(conflict.orderNumber, {});
      this.auditService.recordAdminAction({
        actionType: "customers.conflict.ignored",
        targetType: "customer_conflict",
        targetId: conflict.id,
        actorName: normalizeText(input.actor) ?? "admin",
        summary: `Conflicto de identidad ${conflict.id} ignorado manualmente.`,
        metadata: {
          orderNumber: conflict.orderNumber
        }
      });

      return actionResponse("ok", "Conflicto ignorado.", conflict.id);
    }

    if (input.action === "assign_existing") {
      if (!input.winnerCustomerId) {
        throw new BadRequestException("Debes indicar el cliente canónico a asignar.");
      }

      const winner = await this.requireActiveCustomerRecord(input.winnerCustomerId);
      await this.enrichCustomerFromOrder(winner, conflict.orderNumber);

      await this.prisma.customerIdentityConflict.update({
        where: { id: conflict.id },
        data: {
          status: CustomerIdentityConflictStatus.resolved,
          resolvedCustomerId: winner.id,
          resolutionType: "assign_existing",
          resolutionNotes: normalizeText(input.notes),
          resolvedAt: new Date()
        }
      });

      await this.ordersService.applyCustomerResolution(conflict.orderNumber, {
        customerId: winner.id
      });

      this.auditService.recordAdminAction({
        actionType: "customers.conflict.assigned",
        targetType: "customer_conflict",
        targetId: conflict.id,
        actorName: normalizeText(input.actor) ?? "admin",
        summary: `Conflicto ${conflict.id} resuelto asignando el cliente ${winner.id}.`,
        metadata: {
          orderNumber: conflict.orderNumber,
          winnerCustomerId: winner.id
        }
      });

      return actionResponse("ok", "Conflicto resuelto y pedido asociado al cliente seleccionado.", conflict.id);
    }

    if (!input.winnerCustomerId || !input.mergeSourceCustomerId) {
      throw new BadRequestException("Para fusionar debes indicar cliente destino y cliente fuente.");
    }

    const target = await this.mergeCustomersInternal({
      sourceCustomerId: input.mergeSourceCustomerId,
      targetCustomerId: input.winnerCustomerId,
      actor: input.actor,
      notes: input.notes,
      conflictId: conflict.id
    });

    await this.ordersService.applyCustomerResolution(conflict.orderNumber, {
      customerId: target.id
    });

    return actionResponse("ok", "Conflicto resuelto con fusión manual.", conflict.id);
  }

  async mergeCustomers(input: CustomerMergeInput) {
    const target = await this.mergeCustomersInternal(input);
    return wrapResponse(await this.toCustomerDetailWithOrders(target), {
      merged: true
    });
  }

  async resolveCustomerFromOrderSnapshot(order: OrderSnapshotRecord) {
    const normalized = this.normalizeOrderCustomer(order);
    if (!normalized) {
      return {
        customerId: order.customerId,
        customerConflictId: order.customerConflictId
      };
    }

    const role = await this.ensureCustomerRole();
    const linkedCustomer = order.customerId ? await this.findResolvedCustomerById(order.customerId) : null;
    const candidates = await this.findResolutionCandidates(normalized, linkedCustomer);

    if (candidates.length > 1) {
      const conflict = await this.upsertCustomerConflict(order, normalized, candidates);
      return {
        customerId: undefined,
        customerConflictId: conflict.id
      };
    }

    const resolvedCustomer = candidates.length
      ? await this.updateCustomerFromOrder(candidates[0], normalized, role.id)
      : await this.materializeCustomerFromOrder(normalized, role.id);

    await this.closeConflictForOrder(order.orderNumber, resolvedCustomer.id, "assign_existing");

    return {
      customerId: resolvedCustomer.id,
      customerConflictId: undefined
    };
  }

  private async requireCustomerConflict(id: string) {
    const conflict = await this.prisma.customerIdentityConflict.findUnique({
      where: { id },
      include: {
        resolvedCustomer: {
          include: {
            user: true,
            addresses: true,
            loyaltyAccount: true,
            mergedIntoCustomer: true,
            mergedCustomers: true
          }
        }
      }
    });

    if (!conflict) {
      throw new NotFoundException(`No encontramos el conflicto ${id}.`);
    }

    return conflict;
  }

  private async loadCustomerRecordsByIds(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (!uniqueIds.length) {
      return new Map<string, CustomerRecord>();
    }

    const records = await this.prisma.customer.findMany({
      where: {
        id: {
          in: uniqueIds
        }
      },
      include: {
        user: true,
        addresses: true,
        loyaltyAccount: true,
        mergedIntoCustomer: true,
        mergedCustomers: true
      }
    });

    const map = new Map<string, CustomerRecord>();
    for (const record of records) {
      const active = await this.resolveActiveCustomerRecord(record);
      map.set(record.id, active);
      map.set(active.id, active);
    }

    return map;
  }

  private async findResolvedCustomerById(id: string) {
    const record = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: true,
        addresses: true,
        loyaltyAccount: true,
        mergedIntoCustomer: true,
        mergedCustomers: true
      }
    });

    if (!record) {
      return null;
    }

    return this.resolveActiveCustomerRecord(record);
  }

  private async requireActiveCustomerRecord(id: string) {
    const record = await this.findResolvedCustomerById(id);
    if (!record || record.mergeStatus !== CustomerMergeStatus.active) {
      throw new NotFoundException(`No encontramos un cliente activo con id ${id}.`);
    }

    return record;
  }

  private async resolveActiveCustomerRecord(record: CustomerRecord): Promise<CustomerRecord> {
    let current = record;
    const visited = new Set<string>();

    while (current.mergeStatus === CustomerMergeStatus.merged && current.mergedIntoCustomerId && !visited.has(current.id)) {
      visited.add(current.id);
      const next = await this.prisma.customer.findUnique({
        where: {
          id: current.mergedIntoCustomerId
        },
        include: {
          user: true,
          addresses: true,
          loyaltyAccount: true,
          mergedIntoCustomer: true,
          mergedCustomers: true
        }
      });

      if (!next) {
        break;
      }

      current = next;
    }

    return current;
  }

  private async findResolutionCandidates(normalized: NormalizedOrderCustomer, linkedCustomer?: CustomerRecord | null) {
    const candidates = new Map<string, CustomerRecord>();

    const addCandidate = async (candidate?: CustomerRecord | null) => {
      if (!candidate) {
        return;
      }

      const active = await this.resolveActiveCustomerRecord(candidate);
      candidates.set(active.id, active);
    };

    await addCandidate(linkedCustomer);

    if (normalized.documentType && normalized.documentNumber) {
      await addCandidate(
        await this.prisma.customer.findFirst({
          where: {
            documentType: normalized.documentType,
            documentNumber: normalized.documentNumber
          },
          include: {
            user: true,
            addresses: true,
            loyaltyAccount: true,
            mergedIntoCustomer: true,
            mergedCustomers: true
          }
        })
      );
    }

    if (normalized.email) {
      const user = await this.prisma.user.findUnique({
        where: {
          email: normalized.email
        },
        include: {
          roles: true,
          customer: {
            include: {
              user: true,
              addresses: true,
              loyaltyAccount: true,
              mergedIntoCustomer: true,
              mergedCustomers: true
            }
          }
        }
      });

      await addCandidate(user?.customer);
    }

    if (normalized.phone) {
      const user = await this.prisma.user.findUnique({
        where: {
          phone: normalized.phone
        },
        include: {
          roles: true,
          customer: {
            include: {
              user: true,
              addresses: true,
              loyaltyAccount: true,
              mergedIntoCustomer: true,
              mergedCustomers: true
            }
          }
        }
      });

      await addCandidate(user?.customer);
    }

    return Array.from(candidates.values());
  }

  private async upsertCustomerConflict(
    order: OrderSnapshotRecord,
    normalized: NormalizedOrderCustomer,
    candidates: CustomerRecord[]
  ) {
    const reason = this.buildConflictReason(normalized, candidates);

    return this.prisma.customerIdentityConflict.upsert({
      where: {
        orderNumber: order.orderNumber
      },
      update: {
        status: CustomerIdentityConflictStatus.open,
        reason,
        customerName: normalized.fullName,
        email: normalized.email ?? null,
        phone: normalized.phone ?? null,
        documentType: normalized.documentType ?? null,
        documentNumber: normalized.documentNumber ?? null,
        candidateCustomerIds: candidates.map((candidate) => candidate.id),
        resolvedCustomerId: null,
        resolutionType: null,
        resolutionNotes: null,
        resolvedAt: null
      },
      create: {
        orderNumber: order.orderNumber,
        status: CustomerIdentityConflictStatus.open,
        reason,
        customerName: normalized.fullName,
        email: normalized.email ?? null,
        phone: normalized.phone ?? null,
        documentType: normalized.documentType ?? null,
        documentNumber: normalized.documentNumber ?? null,
        candidateCustomerIds: candidates.map((candidate) => candidate.id)
      }
    });
  }

  private async closeConflictForOrder(
    orderNumber: string,
    customerId: string,
    resolutionType: "assign_existing" | "merge"
  ) {
    await this.prisma.customerIdentityConflict.updateMany({
      where: {
        orderNumber,
        status: {
          in: [CustomerIdentityConflictStatus.open, CustomerIdentityConflictStatus.ignored]
        }
      },
      data: {
        status: resolutionType === "merge" ? CustomerIdentityConflictStatus.merged : CustomerIdentityConflictStatus.resolved,
        resolvedCustomerId: customerId,
        resolutionType,
        resolvedAt: new Date()
      }
    });
  }

  private buildConflictReason(normalized: NormalizedOrderCustomer, candidates: CustomerRecord[]) {
    const clues: string[] = [];
    if (normalized.documentType && normalized.documentNumber) {
      clues.push("documento");
    }
    if (normalized.email) {
      clues.push("email");
    }
    if (normalized.phone) {
      clues.push("teléfono");
    }

    return clues.length
      ? `Se detectaron múltiples clientes canónicos posibles usando ${clues.join(", ")}.`
      : `Se detectaron múltiples clientes canónicos posibles para ${normalized.fullName}.`;
  }

  private toCustomerConflictSummary(
    record: CustomerConflictRecord,
    candidates: Map<string, CustomerRecord>,
    orders: OrderSnapshotRecord[] = []
  ): CustomerIdentityConflictSummary {
    return {
      id: record.id,
      orderNumber: record.orderNumber,
      status: record.status,
      reason: record.reason,
      customerName: record.customerName,
      email: record.email ?? undefined,
      phone: record.phone ?? undefined,
      documentType: normalizeDocumentType(record.documentType as CheckoutDocumentType | null | undefined),
      documentNumber: record.documentNumber ?? undefined,
      candidateCustomers: record.candidateCustomerIds
        .map((candidateId) => candidates.get(candidateId))
        .filter((candidate): candidate is CustomerRecord => Boolean(candidate))
        .map((candidate) => this.toCustomerConflictCandidateSummary(candidate, orders)),
      createdAt: record.createdAt.toISOString(),
      resolvedAt: record.resolvedAt?.toISOString(),
      resolutionNotes: record.resolutionNotes ?? undefined,
      resolvedCustomerId: record.resolvedCustomerId ?? undefined,
      resolutionType: record.resolutionType as CustomerIdentityConflictSummary["resolutionType"] | undefined
    };
  }

  private toCustomerConflictCandidateSummary(
    record: CustomerRecord,
    orders: OrderSnapshotRecord[]
  ): CustomerConflictCandidateSummary {
    return {
      id: record.id,
      fullName: `${record.firstName} ${record.lastName}`.trim(),
      email: record.user.email,
      phone: record.user.phone ?? undefined,
      documentType: normalizeDocumentType(record.documentType as CheckoutDocumentType | null | undefined),
      documentNumber: record.documentNumber ?? undefined,
      ordersCount: this.matchingOrders(record, orders).length
    };
  }

  private normalizeOrderCustomer(order: OrderSnapshotRecord): NormalizedOrderCustomer | null {
    const rawFirstName = normalizeText(order.customer?.firstName);
    const rawLastName = normalizeText(order.customer?.lastName);
    const fullName = normalizeText(order.customerName) ?? normalizeName(rawFirstName, rawLastName);
    if (!fullName) {
      return null;
    }

    const splitName = splitFullName(fullName);
    const normalizedFirstName = normalizeIdentityText(rawFirstName);
    const normalizedLastName = normalizeIdentityText(rawLastName);
    const shouldSplitFullName =
      !rawFirstName ||
      !rawLastName ||
      Boolean(normalizedFirstName && normalizedLastName && normalizedFirstName.includes(normalizedLastName));
    const firstName = shouldSplitFullName ? splitName.firstName : rawFirstName;
    const lastName = shouldSplitFullName ? splitName.lastName : rawLastName;
    const rawEmail = normalizeText(order.customer?.email);
    const email = rawEmail ? normalizeEmail(rawEmail) : undefined;
    const phone = normalizePhone(order.customer?.phone);
    const documentType = normalizeDocumentType(order.customer?.documentType);
    const documentNumber = normalizeDocumentNumber(order.customer?.documentNumber, documentType);
    const address = this.normalizeOrderAddress(order.address, fullName);
    const identityKey =
      buildDocumentIdentityKey(documentType, documentNumber) ??
      (email ? `email:${email}` : undefined) ??
      buildPhoneNameIdentityKey(phone, fullName) ??
      buildNameAddressIdentityKey(fullName, address) ??
      (phone ? `phone:${phone}` : undefined) ??
      `order:${order.orderNumber.toLowerCase()}`;

    return {
      firstName,
      lastName,
      fullName,
      email,
      persistedEmail: email ?? buildSyntheticCustomerEmail(identityKey),
      phone,
      documentType,
      documentNumber,
      documentIdentityKey: buildDocumentIdentityKey(documentType, documentNumber),
      phoneNameIdentityKey: buildPhoneNameIdentityKey(phone, fullName),
      nameAddressIdentityKey: buildNameAddressIdentityKey(fullName, address),
      address
    };
  }

  private normalizeOrderAddress(address?: OrderSnapshotAddressRecord, fullName?: string): NormalizedCustomerAddress | undefined {
    if (!address) {
      return undefined;
    }

    const line1 = normalizeText(address.line1);
    const city = normalizeText(address.city);
    const region = normalizeText(address.region);
    if (!line1 || !city || !region) {
      return undefined;
    }

    return {
      label: normalizeText(address.label) ?? "Principal",
      recipientName: normalizeText(address.recipientName) ?? fullName ?? "Cliente Huelegood",
      line1,
      line2: normalizeText(address.line2),
      city,
      region,
      postalCode: normalizeText(address.postalCode) ?? "",
      countryCode: normalizeText(address.countryCode)?.toUpperCase() ?? "PE",
      departmentCode: normalizeText(address.departmentCode),
      departmentName: normalizeText(address.departmentName),
      provinceCode: normalizeText(address.provinceCode),
      provinceName: normalizeText(address.provinceName),
      districtCode: normalizeText(address.districtCode),
      districtName: normalizeText(address.districtName)
    };
  }

  private async materializeCustomerFromOrder(normalized: NormalizedOrderCustomer, roleId: string) {
    const existingUser = await this.findExistingUserForOrder(normalized);
    if (existingUser) {
      if (existingUser.customer) {
        return this.updateCustomerFromOrder(existingUser.customer, normalized, roleId);
      }

      return this.createCustomerForExistingUser(existingUser, normalized, roleId);
    }

    const created = await this.prisma.user.create({
      data: {
        email: normalized.persistedEmail,
        phone: normalized.phone ?? null,
        passwordHash: hashPassword(randomBytes(24).toString("hex")),
        status: LifecycleStatus.active,
        roles: {
          create: [
            {
              roleId
            }
          ]
        },
        customer: {
          create: {
            firstName: normalized.firstName,
            lastName: normalized.lastName,
            documentType: normalized.documentType,
            documentNumber: normalized.documentNumber,
            marketingOptIn: false,
            status: LifecycleStatus.active,
            addresses: normalized.address
              ? {
                  create: [
                    {
                      ...normalized.address,
                      isDefault: true
                    }
                  ]
                }
              : undefined
          }
        }
      },
      include: {
        customer: {
          include: {
            user: true,
            addresses: true,
            loyaltyAccount: true,
            mergedIntoCustomer: true,
            mergedCustomers: true
          }
        }
      }
    });

    const customer = created.customer;
    if (!customer) {
      throw new BadRequestException("No pudimos materializar el cliente desde pedidos.");
    }

    return customer;
  }

  private async findExistingUserForOrder(normalized: NormalizedOrderCustomer): Promise<UserRecord | null> {
    if (normalized.email) {
      const byEmail = await this.prisma.user.findUnique({
        where: {
          email: normalized.email
        },
        include: {
          roles: true,
          customer: {
            include: {
              user: true,
              addresses: true,
              loyaltyAccount: true,
              mergedIntoCustomer: true,
              mergedCustomers: true
            }
          }
        }
      });

      if (byEmail) {
        return byEmail;
      }
    }

    if (normalized.phone) {
      return this.prisma.user.findUnique({
        where: {
          phone: normalized.phone
        },
        include: {
          roles: true,
          customer: {
            include: {
              user: true,
              addresses: true,
              loyaltyAccount: true,
              mergedIntoCustomer: true,
              mergedCustomers: true
            }
          }
        }
      });
    }

    return this.prisma.user.findUnique({
      where: {
        email: normalized.persistedEmail
      },
      include: {
        roles: true,
        customer: {
          include: {
            user: true,
            addresses: true,
            loyaltyAccount: true,
            mergedIntoCustomer: true,
            mergedCustomers: true
          }
        }
      }
    });
  }

  private async createCustomerForExistingUser(user: UserRecord, normalized: NormalizedOrderCustomer, roleId: string) {
    const shouldUpgradeEmail =
      normalized.email && (isSyntheticCustomerEmail(user.email) || !normalizeText(user.email)) && normalizeEmail(user.email) !== normalized.email;
    const shouldAttachPhone = normalized.phone && !normalizePhone(user.phone);

    if (shouldUpgradeEmail || shouldAttachPhone) {
      const existingByEmail = shouldUpgradeEmail
        ? await this.prisma.user.findUnique({
            where: {
              email: normalized.email
            }
          })
        : null;
      const existingByPhone = shouldAttachPhone
        ? await this.prisma.user.findUnique({
            where: {
              phone: normalized.phone
            }
          })
        : null;

      await this.prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          email: shouldUpgradeEmail && (!existingByEmail || existingByEmail.id === user.id) ? normalized.email : undefined,
          phone: shouldAttachPhone && (!existingByPhone || existingByPhone.id === user.id) ? normalized.phone : undefined
        }
      });
    }

    await this.syncCustomerRole(user.id, roleId);

    const created = await this.prisma.customer.create({
      data: {
        userId: user.id,
        firstName: normalized.firstName,
        lastName: normalized.lastName,
        documentType: normalized.documentType,
        documentNumber: normalized.documentNumber,
        marketingOptIn: false,
        status: LifecycleStatus.active,
        addresses: normalized.address
          ? {
              create: [
                {
                  ...normalized.address,
                  isDefault: true
                }
              ]
            }
          : undefined
      },
      include: {
        user: true,
        addresses: true,
        loyaltyAccount: true,
        mergedIntoCustomer: true,
        mergedCustomers: true
      }
    });

    return created;
  }

  private async updateCustomerFromOrder(record: CustomerRecord, normalized: NormalizedOrderCustomer, roleId: string) {
    const userChanges: Prisma.UserUpdateInput = {};
    const customerChanges: Prisma.CustomerUpdateInput = {};

    if (normalized.email && isSyntheticCustomerEmail(record.user.email) && normalizeEmail(record.user.email) !== normalized.email) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: {
          email: normalized.email
        }
      });

      if (!existingByEmail || existingByEmail.id === record.userId) {
        userChanges.email = normalized.email;
      }
    }

    if (normalized.phone && !normalizePhone(record.user.phone)) {
      const existingByPhone = await this.prisma.user.findUnique({
        where: {
          phone: normalized.phone
        }
      });

      if (!existingByPhone || existingByPhone.id === record.userId) {
        userChanges.phone = normalized.phone;
      }
    }

    if (
      normalized.firstName &&
      (
        (!normalizeText(record.firstName) || record.firstName === "Cliente") ||
        (isSyntheticCustomerEmail(record.user.email) && record.firstName !== normalized.firstName)
      )
    ) {
      customerChanges.firstName = normalized.firstName;
    }

    if (
      normalized.lastName &&
      (
        (!normalizeText(record.lastName) || record.lastName === "Huelegood") ||
        (isSyntheticCustomerEmail(record.user.email) && record.lastName !== normalized.lastName)
      )
    ) {
      customerChanges.lastName = normalized.lastName;
    }

    if ((!record.documentType || !record.documentNumber) && normalized.documentType && normalized.documentNumber) {
      const existingDocumentOwner = await this.prisma.customer.findFirst({
        where: {
          documentType: normalized.documentType,
          documentNumber: normalized.documentNumber
        }
      });

      if (!existingDocumentOwner || existingDocumentOwner.id === record.id) {
        customerChanges.documentType = normalized.documentType;
        customerChanges.documentNumber = normalized.documentNumber;
      }
    }

    await this.syncCustomerRole(record.userId, roleId);

    const addressToCreate = normalized.address
      ? this.resolveAddressCreate(record.addresses, normalized.address)
      : undefined;

    if (
      Object.keys(userChanges).length === 0 &&
      Object.keys(customerChanges).length === 0 &&
      !addressToCreate
    ) {
      return record;
    }

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userChanges).length > 0) {
        await tx.user.update({
          where: {
            id: record.userId
          },
          data: userChanges
        });
      }

      if (Object.keys(customerChanges).length > 0) {
        await tx.customer.update({
          where: {
            id: record.id
          },
          data: customerChanges
        });
      }

      if (addressToCreate) {
        await tx.customerAddress.create({
          data: {
            customerId: record.id,
            ...addressToCreate
          }
        });
      }
    });

    return this.requireCustomerRecord(record.id);
  }

  private resolveAddressCreate(existingAddresses: CustomerRecord["addresses"], address: NormalizedCustomerAddress) {
    const nextFingerprint = orderAddressFingerprint(address);
    if (!nextFingerprint) {
      return undefined;
    }

    const existingFingerprints = new Set(
      existingAddresses.map((item) =>
        orderAddressFingerprint({
          line1: item.line1,
          line2: item.line2 ?? undefined,
          districtName: item.districtName ?? undefined,
          city: item.city,
          provinceName: item.provinceName ?? undefined,
          region: item.region,
          departmentName: item.departmentName ?? undefined,
          postalCode: item.postalCode,
          countryCode: item.countryCode
        })
      )
    );

    if (existingFingerprints.has(nextFingerprint)) {
      return undefined;
    }

    return {
      label: normalizeText(address.label) ?? (existingAddresses.length === 0 ? "Principal" : `Dirección ${existingAddresses.length + 1}`),
      recipientName: normalizeText(address.recipientName) ?? "Cliente Huelegood",
      line1: normalizeText(address.line1) ?? "",
      line2: normalizeText(address.line2) ?? null,
      city: normalizeText(address.city) ?? "",
      region: normalizeText(address.region) ?? "",
      postalCode: normalizeText(address.postalCode) ?? "",
      countryCode: normalizeText(address.countryCode)?.toUpperCase() ?? "PE",
      departmentCode: normalizeText(address.departmentCode) ?? null,
      departmentName: normalizeText(address.departmentName) ?? null,
      provinceCode: normalizeText(address.provinceCode) ?? null,
      provinceName: normalizeText(address.provinceName) ?? null,
      districtCode: normalizeText(address.districtCode) ?? null,
      districtName: normalizeText(address.districtName) ?? null,
      isDefault: existingAddresses.length === 0
    };
  }

  private async syncCustomerRole(userId: string, roleId: string) {
    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      },
      update: {},
      create: {
        userId,
        roleId
      }
    });
  }

  private async enrichCustomerFromOrder(record: CustomerRecord, orderNumber: string) {
    const order = this.ordersService.getOrderSnapshot(orderNumber);
    if (!order) {
      return record;
    }

    const normalized = this.normalizeOrderCustomer(order);
    if (!normalized) {
      return record;
    }

    const role = await this.ensureCustomerRole();
    return this.updateCustomerFromOrder(record, normalized, role.id);
  }

  private async mergeCustomersInternal(input: CustomerMergeInput) {
    if (input.sourceCustomerId === input.targetCustomerId) {
      throw new BadRequestException("El cliente fuente y el destino no pueden ser el mismo.");
    }

    const [source, target] = await Promise.all([
      this.requireActiveCustomerRecord(input.sourceCustomerId),
      this.requireActiveCustomerRecord(input.targetCustomerId)
    ]);

    const sourceDocumentType = normalizeDocumentType(source.documentType as CheckoutDocumentType | null | undefined);
    const targetDocumentType = normalizeDocumentType(target.documentType as CheckoutDocumentType | null | undefined);
    const sourceDocumentNumber = normalizeDocumentNumber(source.documentNumber, sourceDocumentType);
    const targetDocumentNumber = normalizeDocumentNumber(target.documentNumber, targetDocumentType);

    if (
      sourceDocumentType &&
      sourceDocumentNumber &&
      targetDocumentType &&
      targetDocumentNumber &&
      (sourceDocumentType !== targetDocumentType || sourceDocumentNumber !== targetDocumentNumber)
    ) {
      throw new ConflictException("No podemos fusionar clientes con documentos canónicos distintos.");
    }

    const sourceRealEmail = isSyntheticCustomerEmail(source.user.email) ? undefined : normalizeEmail(source.user.email);
    const targetRealEmail = isSyntheticCustomerEmail(target.user.email) ? undefined : normalizeEmail(target.user.email);
    const sourcePhone = normalizePhone(source.user.phone);
    const targetPhone = normalizePhone(target.user.phone);
    const transferredSourceEmail =
      !targetRealEmail && sourceRealEmail && normalizeEmail(source.user.email) !== normalizeEmail(target.user.email)
        ? sourceRealEmail
        : undefined;
    const transferredSourcePhone = !targetPhone && sourcePhone ? sourcePhone : undefined;
    const sourceAddressIdsToDelete: string[] = [];
    const targetAddressFingerprints = new Set(
      target.addresses.map((address) =>
        orderAddressFingerprint({
          line1: address.line1,
          line2: address.line2 ?? undefined,
          districtName: address.districtName ?? undefined,
          city: address.city,
          provinceName: address.provinceName ?? undefined,
          region: address.region,
          departmentName: address.departmentName ?? undefined,
          postalCode: address.postalCode,
          countryCode: address.countryCode
        })
      )
    );
    let targetHasAddress = target.addresses.length > 0;

    await this.prisma.$transaction(async (tx) => {
      const targetCustomerChanges: Prisma.CustomerUpdateInput = {};
      const sourceCustomerChanges: Prisma.CustomerUpdateInput = {
        mergeStatus: CustomerMergeStatus.merged,
        mergedIntoCustomer: {
          connect: {
            id: target.id
          }
        }
      };
      const targetUserChanges: Prisma.UserUpdateInput = {};
      const sourceUserChanges: Prisma.UserUpdateInput = {};

      if ((!target.firstName || target.firstName === "Cliente") && normalizeText(source.firstName)) {
        targetCustomerChanges.firstName = source.firstName;
      }

      if ((!target.lastName || target.lastName === "Huelegood") && normalizeText(source.lastName)) {
        targetCustomerChanges.lastName = source.lastName;
      }

      if (!target.marketingOptIn && source.marketingOptIn) {
        targetCustomerChanges.marketingOptIn = true;
      }

      if (!targetDocumentType && !targetDocumentNumber && sourceDocumentType && sourceDocumentNumber) {
        targetCustomerChanges.documentType = sourceDocumentType;
        targetCustomerChanges.documentNumber = sourceDocumentNumber;
        sourceCustomerChanges.documentType = null;
        sourceCustomerChanges.documentNumber = null;
      }

      if (transferredSourceEmail) {
        targetUserChanges.email = transferredSourceEmail;
        sourceUserChanges.email = buildSyntheticCustomerEmail(`merged:${source.id}:${target.id}`);
      }

      if (transferredSourcePhone) {
        targetUserChanges.phone = transferredSourcePhone;
        sourceUserChanges.phone = null;
      }

      for (const address of source.addresses) {
        const fingerprint = orderAddressFingerprint({
          line1: address.line1,
          line2: address.line2 ?? undefined,
          districtName: address.districtName ?? undefined,
          city: address.city,
          provinceName: address.provinceName ?? undefined,
          region: address.region,
          departmentName: address.departmentName ?? undefined,
          postalCode: address.postalCode,
          countryCode: address.countryCode
        });

        if (targetAddressFingerprints.has(fingerprint)) {
          sourceAddressIdsToDelete.push(address.id);
          continue;
        }

        targetAddressFingerprints.add(fingerprint);
        await tx.customerAddress.update({
          where: {
            id: address.id
          },
          data: {
            customerId: target.id,
            isDefault: !targetHasAddress
          }
        });
        targetHasAddress = true;
      }

      if (sourceAddressIdsToDelete.length > 0) {
        await tx.customerAddress.deleteMany({
          where: {
            id: {
              in: sourceAddressIdsToDelete
            }
          }
        });
      }

      await tx.cart.updateMany({
        where: {
          customerId: source.id
        },
        data: {
          customerId: target.id
        }
      });

      await tx.order.updateMany({
        where: {
          customerId: source.id
        },
        data: {
          customerId: target.id
        }
      });

      await tx.redemption.updateMany({
        where: {
          customerId: source.id
        },
        data: {
          customerId: target.id
        }
      });

      await tx.campaignRecipient.updateMany({
        where: {
          customerId: source.id
        },
        data: {
          customerId: target.id
        }
      });

      await tx.marketingEvent.updateMany({
        where: {
          customerId: source.id
        },
        data: {
          customerId: target.id
        }
      });

      if (source.loyaltyAccount && target.loyaltyAccount) {
        await tx.loyaltyMovement.updateMany({
          where: {
            loyaltyAccountId: source.loyaltyAccount.id
          },
          data: {
            loyaltyAccountId: target.loyaltyAccount.id
          }
        });

        await tx.redemption.updateMany({
          where: {
            loyaltyAccountId: source.loyaltyAccount.id
          },
          data: {
            loyaltyAccountId: target.loyaltyAccount.id
          }
        });

        await tx.loyaltyAccount.update({
          where: {
            id: target.loyaltyAccount.id
          },
          data: {
            availablePoints: {
              increment: source.loyaltyAccount.availablePoints
            },
            pendingPoints: {
              increment: source.loyaltyAccount.pendingPoints
            },
            redeemedPoints: {
              increment: source.loyaltyAccount.redeemedPoints
            }
          }
        });

        await tx.loyaltyAccount.delete({
          where: {
            id: source.loyaltyAccount.id
          }
        });
      } else if (source.loyaltyAccount && !target.loyaltyAccount) {
        await tx.loyaltyAccount.update({
          where: {
            id: source.loyaltyAccount.id
          },
          data: {
            customerId: target.id
          }
        });
      }

      if (Object.keys(sourceUserChanges).length > 0) {
        await tx.user.update({
          where: {
            id: source.userId
          },
          data: sourceUserChanges
        });
      }

      if (Object.keys(targetUserChanges).length > 0) {
        await tx.user.update({
          where: {
            id: target.userId
          },
          data: targetUserChanges
        });
      }

      await tx.customer.update({
        where: {
          id: source.id
        },
        data: sourceCustomerChanges
      });

      if (Object.keys(targetCustomerChanges).length > 0) {
        await tx.customer.update({
          where: {
            id: target.id
          },
          data: targetCustomerChanges
        });
      }

      if (input.conflictId) {
        await tx.customerIdentityConflict.update({
          where: {
            id: input.conflictId
          },
          data: {
            status: CustomerIdentityConflictStatus.merged,
            resolvedCustomerId: target.id,
            resolutionType: "merge",
            resolutionNotes: normalizeText(input.notes),
            resolvedAt: new Date()
          }
        });
      }
    });

    await this.ordersService.reassignMergedCustomer(source.id, target.id);
    this.auditService.recordAdminAction({
      actionType: "customers.merged",
      targetType: "customer",
      targetId: target.id,
      actorName: normalizeText(input.actor) ?? "admin",
      summary: `Cliente ${source.id} fusionado dentro de ${target.id}.`,
      metadata: {
        sourceCustomerId: source.id,
        targetCustomerId: target.id,
        conflictId: input.conflictId,
        notes: normalizeText(input.notes)
      }
    });

    return this.requireCustomerRecord(target.id);
  }

  private async requireCustomerRecord(id: string) {
    const record = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: true,
        addresses: true,
        loyaltyAccount: true,
        mergedIntoCustomer: true,
        mergedCustomers: true
      }
    });

    if (!record) {
      throw new BadRequestException("No pudimos reconstruir el perfil del cliente sincronizado.");
    }

    return record;
  }

  private async toCustomerDetailWithOrders(record: CustomerRecord) {
    const orders = this.matchingOrders(record, await this.loadOrders());
    return this.toCustomerDetail(record, orders);
  }

  private toCustomerSummary(record: CustomerRecord, orders: OrderSnapshotRecord[]): CustomerSummary {
    const sortedAddresses = sortAddresses(record.addresses);
    const defaultAddress = sortedAddresses[0] ? toAddressSummary(sortedAddresses[0]) : undefined;
    const sortedOrders = orders.slice().sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
      id: record.id,
      userId: record.userId,
      email: record.user.email,
      phone: record.user.phone ?? undefined,
      firstName: record.firstName,
      lastName: record.lastName,
      fullName: `${record.firstName} ${record.lastName}`.trim(),
      documentType: normalizeDocumentType(record.documentType as CheckoutDocumentType | null | undefined),
      documentNumber: record.documentNumber ?? undefined,
      marketingOptIn: record.marketingOptIn,
      status: toCustomerStatus(record.status),
      addressesCount: sortedAddresses.length,
      defaultAddressSummary: summarizeDefaultAddress(defaultAddress),
      ordersCount: sortedOrders.length,
      lastOrderAt: sortedOrders[0]?.createdAt,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }

  private toCustomerDetail(record: CustomerRecord, orders: OrderSnapshotRecord[]): CustomerDetail {
    return {
      ...this.toCustomerSummary(record, orders),
      addresses: sortAddresses(record.addresses).map(toAddressSummary),
      recentOrders: orders.slice(0, 12).map(toOrderSummary)
    };
  }

  private matchingOrders(record: CustomerRecord, orders: OrderSnapshotRecord[]) {
    const email = isSyntheticCustomerEmail(record.user.email) ? undefined : normalizeEmail(record.user.email);
    const phone = normalizePhone(record.user.phone);
    const fullName = normalizeIdentityText(normalizeName(record.firstName, record.lastName));
    const documentType = normalizeDocumentType(record.documentType as CheckoutDocumentType | null | undefined);
    const documentNumber = normalizeDocumentNumber(record.documentNumber, documentType);
    const documentKey = buildDocumentIdentityKey(documentType, documentNumber);
    const defaultAddress = sortAddresses(record.addresses)[0];
    const nameAddressKey = buildNameAddressIdentityKey(fullName, {
      line1: defaultAddress?.line1,
      city: defaultAddress?.city,
      region: defaultAddress?.region,
      countryCode: defaultAddress?.countryCode
    });
    const phoneNameKey = buildPhoneNameIdentityKey(phone, fullName);

    return orders
      .filter((order) => {
        if (order.customerId) {
          return order.customerId === record.id;
        }

        const orderDocumentType = normalizeDocumentType(order.customer?.documentType);
        const orderDocumentNumber = normalizeDocumentNumber(order.customer?.documentNumber, orderDocumentType);
        const orderDocumentKey = buildDocumentIdentityKey(orderDocumentType, orderDocumentNumber);
        const orderEmail = order.customer?.email ? normalizeEmail(order.customer.email) : undefined;
        const orderPhone = normalizePhone(order.customer?.phone);
        const orderName = normalizeIdentityText(normalizeName(order.customer?.firstName, order.customer?.lastName, order.customerName));
        const orderPhoneNameKey = buildPhoneNameIdentityKey(orderPhone, orderName);
        const orderNameAddressKey = buildNameAddressIdentityKey(orderName, order.address);

        if (documentKey && orderDocumentKey && documentKey === orderDocumentKey) {
          return true;
        }

        if (orderEmail && orderEmail === email) {
          return true;
        }

        if (phone && orderPhone && phone === orderPhone) {
          return true;
        }

        if (phoneNameKey && orderPhoneNameKey && phoneNameKey === orderPhoneNameKey) {
          return true;
        }

        if (nameAddressKey && orderNameAddressKey && nameAddressKey === orderNameAddressKey) {
          return true;
        }

        return Boolean(fullName && orderName && fullName === orderName && !email && !phone && !documentKey);
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  private async loadOrders() {
    const snapshot = await this.moduleStateService.load<OrdersSnapshot>("orders");
    return snapshot?.orders ?? [];
  }

  private async ensureCustomerRole() {
    return this.prisma.role.upsert({
      where: {
        code: RoleCode.Cliente
      },
      update: {
        name: roleLabels[RoleCode.Cliente],
        isSystem: true
      },
      create: {
        code: RoleCode.Cliente,
        name: roleLabels[RoleCode.Cliente],
        isSystem: true
      }
    });
  }

  private requireEmail(value: string) {
    const email = normalizeText(value);
    if (!email) {
      throw new BadRequestException("El email del cliente es obligatorio.");
    }

    return normalizeEmail(email);
  }

  private requirePassword(value?: string) {
    const password = normalizeText(value);
    if (!password) {
      throw new BadRequestException("La contraseña temporal es obligatoria para crear un cliente.");
    }

    if (password.length < 6) {
      throw new BadRequestException("La contraseña temporal debe tener al menos 6 caracteres.");
    }

    return password;
  }

  private requireName(value: string, message: string) {
    const name = normalizeText(value);
    if (!name) {
      throw new BadRequestException(message);
    }

    return name;
  }

  private async assertUniqueUserFields({
    email,
    phone,
    exceptUserId
  }: {
    email: string;
    phone?: string;
    exceptUserId?: string;
  }) {
    const existingByEmail = await this.prisma.user.findUnique({
      where: {
        email
      }
    });

    if (existingByEmail && existingByEmail.id !== exceptUserId) {
      throw new ConflictException("Ya existe una cuenta con ese email.");
    }

    if (phone) {
      const existingByPhone = await this.prisma.user.findUnique({
        where: {
          phone
        }
      });

      if (existingByPhone && existingByPhone.id !== exceptUserId) {
        throw new ConflictException("Ya existe una cuenta con ese teléfono.");
      }
    }
  }

  private normalizeCustomerDocumentInput(input: Pick<CustomerUpsertInput, "documentType" | "documentNumber">) {
    const documentType = normalizeDocumentType(input.documentType);
    const documentNumber = normalizeDocumentNumber(input.documentNumber, documentType);

    if (input.documentNumber && !documentType) {
      throw new BadRequestException("Selecciona un tipo de documento válido para registrar el número.");
    }

    if (input.documentType && !documentNumber) {
      throw new BadRequestException("Completa el número del documento o elimina el tipo seleccionado.");
    }

    return {
      documentType,
      documentNumber
    };
  }

  private async assertUniqueCustomerDocument(
    document: {
      documentType?: CheckoutDocumentType;
      documentNumber?: string;
    },
    exceptCustomerId?: string
  ) {
    if (!document.documentType || !document.documentNumber) {
      return;
    }

    const existing = await this.prisma.customer.findFirst({
      where: {
        documentType: document.documentType,
        documentNumber: document.documentNumber
      }
    });

    if (existing && existing.id !== exceptCustomerId) {
      throw new ConflictException("Ya existe un cliente con ese documento.");
    }
  }

  private normalizeAddresses(addresses: CustomerAddressInput[], input: CustomerUpsertInput) {
    const meaningfulAddresses = addresses.filter(hasAddressContent);

    return meaningfulAddresses.map((address, index) => {
      const line1 = normalizeText(address.line1);
      const city = normalizeText(address.city);
      const region = normalizeText(address.region);
      const postalCode = normalizeText(address.postalCode);

      if (!line1 || !city || !region || !postalCode) {
        throw new BadRequestException("Si registras una dirección, debes completar línea, ciudad, región y código postal.");
      }

      return {
        label: normalizeText(address.label) ?? (index === 0 ? "Principal" : `Dirección ${index + 1}`),
        recipientName:
          normalizeText(address.recipientName) ??
          `${this.requireName(input.firstName, "El nombre del cliente es obligatorio.")} ${this.requireName(
            input.lastName,
            "El apellido del cliente es obligatorio."
          )}`.trim(),
        line1,
        line2: normalizeText(address.line2),
        city,
        region,
        postalCode,
        countryCode: normalizeText(address.countryCode) ?? "PE",
        departmentCode: normalizeText(address.departmentCode),
        departmentName: normalizeText(address.departmentName),
        provinceCode: normalizeText(address.provinceCode),
        provinceName: normalizeText(address.provinceName),
        districtCode: normalizeText(address.districtCode),
        districtName: normalizeText(address.districtName),
        isDefault: index === 0 ? true : address.isDefault === true
      };
    });
  }
}
