import { randomBytes, scryptSync } from "node:crypto";
import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { LifecycleStatus, Prisma } from "@prisma/client";
import {
  RoleCode,
  type AdminOrderSummary,
  type CustomerAddressInput,
  type CustomerAddressSummary,
  type CustomerDetail,
  type CustomerStatusValue,
  type CustomerSummary,
  type CustomerUpsertInput
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { ModuleStateService } from "../../persistence/module-state.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

type CustomerRecord = Prisma.CustomerGetPayload<{
  include: {
    user: true;
    addresses: true;
  };
}>;

type OrderSnapshotRecord = {
  orderNumber: string;
  customerName: string;
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
  };
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
  [RoleCode.Cliente]: "Cliente"
};

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

function normalizePhone(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized.replace(/\s+/g, "") : undefined;
}

function normalizeName(firstName?: string, lastName?: string, fallback?: string) {
  const composed = [firstName, lastName].map((part) => normalizeText(part)).filter(Boolean).join(" ");
  return composed || normalizeText(fallback) || undefined;
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
    isDefault: address.isDefault
  };
}

function toOrderSummary(order: OrderSnapshotRecord): AdminOrderSummary {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
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

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly moduleStateService: ModuleStateService
  ) {}

  async listCustomers() {
    const [records, orders] = await Promise.all([
      this.prisma.customer.findMany({
        include: {
          user: true,
          addresses: true
        },
        orderBy: {
          updatedAt: "desc"
        }
      }),
      this.loadOrders()
    ]);

    const customers = records.map((record) => this.toCustomerSummary(record, this.matchingOrders(record, orders)));

    return wrapResponse(customers, {
      total: customers.length,
      active: customers.filter((customer) => customer.status === "active").length,
      withOrders: customers.filter((customer) => customer.ordersCount > 0).length
    });
  }

  async getCustomer(id: string) {
    const record = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: true,
        addresses: true
      }
    });

    if (!record) {
      return null;
    }

    return this.toCustomerDetail(record, this.matchingOrders(record, await this.loadOrders()));
  }

  async createCustomer(input: CustomerUpsertInput) {
    const email = this.requireEmail(input.email);
    const password = this.requirePassword(input.password);
    const phone = normalizePhone(input.phone);
    const status = toLifecycleStatus(input.status);

    await this.assertUniqueUserFields({ email, phone });
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
            documentNumber: normalizeText(input.documentNumber),
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
            addresses: true
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
        addresses: true
      }
    });

    if (!existing) {
      throw new BadRequestException("No encontramos el cliente solicitado.");
    }

    const email = this.requireEmail(input.email);
    const phone = normalizePhone(input.phone);

    await this.assertUniqueUserFields({
      email,
      phone,
      exceptUserId: existing.userId
    });

    const status = toLifecycleStatus(input.status);
    const addresses = input.addresses ? this.normalizeAddresses(input.addresses, input) : null;
    const nextPassword = normalizeText(input.password);

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        firstName: this.requireName(input.firstName, "El nombre del cliente es obligatorio."),
        lastName: this.requireName(input.lastName, "El apellido del cliente es obligatorio."),
        documentNumber: normalizeText(input.documentNumber) ?? null,
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
        addresses: true
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
    const existing = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            admin: true,
            vendor: true
          }
        }
      }
    });

    if (!existing) {
      throw new BadRequestException("No encontramos el cliente solicitado.");
    }

    if (existing.user.admin || existing.user.vendor) {
      throw new ConflictException("No podemos eliminar este cliente porque la misma cuenta también cumple otro rol operativo.");
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
    const email = normalizeEmail(record.user.email);
    const phone = normalizePhone(record.user.phone);
    const fullName = normalizeName(record.firstName, record.lastName)?.toLowerCase();

    return orders
      .filter((order) => {
        const orderEmail = order.customer?.email ? normalizeEmail(order.customer.email) : undefined;
        const orderPhone = normalizePhone(order.customer?.phone);
        const orderName = normalizeName(order.customer?.firstName, order.customer?.lastName, order.customerName)?.toLowerCase();

        if (orderEmail && orderEmail === email) {
          return true;
        }

        if (phone && orderPhone && phone === orderPhone) {
          return true;
        }

        return Boolean(fullName && orderName && fullName === orderName);
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
        isDefault: index === 0 ? true : address.isDefault === true
      };
    });
  }
}
