import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CampaignStatus,
  CommissionPayoutStatus,
  CommissionStatus,
  NotificationStatus,
  OrderStatus,
  PaymentStatus,
  RoleCode,
  WholesaleLeadStatus,
  type AdminReportFiltersInput,
  type AdminOrderDetail,
  type AdminMetric,
  type AdminRoleDashboardSummary,
  type AuthUserSummary,
  type CommissionRow,
  type CommissionSummary,
  type ProductSalesReportRow,
  type SalesDetailReportRow,
  type SalesChannelValue,
  type SellerPanelOverviewSummary,
  type VendorSalesReportRow,
  type VendorSummary,
  isOrderCommerciallyReportable
} from "@huelegood/shared";
import { wrapResponse } from "../../common/response";
import { CommissionsService } from "../commissions/commissions.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { MarketingService } from "../marketing/marketing.service";
import { NotificationsService } from "../notifications/notifications.service";
import { OrdersService } from "../orders/orders.service";
import { PaymentsService } from "../payments/payments.service";
import { VendorsService } from "../vendors/vendors.service";
import { WholesaleService } from "../wholesale/wholesale.service";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0
  }).format(value);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function fullCustomerName(customer: AdminOrderDetail["customer"]) {
  return [customer.firstName, customer.lastName].map((part) => part.trim()).filter(Boolean).join(" ");
}

function deriveCommissionStatus(commissions: CommissionSummary[]) {
  const priority: CommissionStatus[] = [
    CommissionStatus.Paid,
    CommissionStatus.ScheduledForPayout,
    CommissionStatus.Payable,
    CommissionStatus.Blocked,
    CommissionStatus.Reversed,
    CommissionStatus.Cancelled,
    CommissionStatus.Approved,
    CommissionStatus.Attributed,
    CommissionStatus.PendingAttribution
  ];

  for (const status of priority) {
    if (commissions.some((commission) => commission.status === status)) {
      return status;
    }
  }

  return CommissionStatus.PendingAttribution;
}

function buildCommissionRows(vendors: VendorSummary[], commissions: CommissionSummary[]) {
  return vendors.map((vendor) => {
    const vendorCommissions = commissions.filter((commission) => commission.vendorCode === vendor.code);

    return {
      vendor: vendor.name,
      code: vendor.code,
      totalSales: vendor.sales,
      commission: vendor.commissions,
      status: deriveCommissionStatus(vendorCommissions),
      period: vendorCommissions[0]?.period ?? "Periodo actual"
    } satisfies CommissionRow;
  });
}

function resolveDashboardFocus(user: AuthUserSummary): AdminRoleDashboardSummary["focus"] {
  const roleCodes = user.roles.map((role) => role.code);

  if (roleCodes.includes(RoleCode.SuperAdmin) || roleCodes.includes(RoleCode.Admin)) {
    return "executive";
  }

  if (roleCodes.includes(RoleCode.OperadorPagos)) {
    return "payments";
  }

  if (roleCodes.includes(RoleCode.Marketing)) {
    return "marketing";
  }

  return "sales";
}

function toPeriodRange(from: string, to: string) {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to.includes("T") ? to : `${to}T23:59:59.999Z`).getTime();

  return {
    fromMs,
    toMs
  };
}

function isInRange(value: string | undefined, from: string, to: string) {
  if (!value) {
    return false;
  }

  const { fromMs, toMs } = toPeriodRange(from, to);
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp >= fromMs && timestamp <= toMs;
}

interface NormalizedAdminReportFilters {
  salesChannel?: SalesChannelValue;
  vendorCode?: string;
  productSlug?: string;
  sku?: string;
  hasProductFilter: boolean;
}

interface ScopedSalesOrder {
  order: AdminOrderDetail;
  confirmedAt: string;
  salesChannel: SalesChannelValue;
  matchedItems: AdminOrderDetail["items"];
  revenue: number;
}

function normalizeReportText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeReportCode(value?: string) {
  return normalizeReportText(value)?.toUpperCase();
}

function normalizeReportSlug(value?: string) {
  return normalizeReportText(value)?.toLowerCase();
}

function normalizeReportFilters(filters: AdminReportFiltersInput = {}): NormalizedAdminReportFilters {
  const salesChannel = filters.salesChannel === "web" || filters.salesChannel === "manual" ? filters.salesChannel : undefined;
  const vendorCode = normalizeReportCode(filters.vendorCode);
  const productSlug = normalizeReportSlug(filters.productSlug);
  const sku = normalizeReportCode(filters.sku);

  return {
    salesChannel,
    vendorCode,
    productSlug,
    sku,
    hasProductFilter: Boolean(productSlug || sku)
  };
}

function matchesReportOrder(order: Pick<AdminOrderDetail, "salesChannel" | "vendorCode">, filters: NormalizedAdminReportFilters) {
  if (filters.salesChannel && order.salesChannel !== filters.salesChannel) {
    return false;
  }

  if (filters.vendorCode && normalizeReportCode(order.vendorCode) !== filters.vendorCode) {
    return false;
  }

  return true;
}

function filterReportItems(order: Pick<AdminOrderDetail, "items">, filters: NormalizedAdminReportFilters) {
  if (!filters.hasProductFilter) {
    return order.items;
  }

  return order.items.filter((item) => {
    if (filters.productSlug && normalizeReportSlug(item.slug) !== filters.productSlug) {
      return false;
    }

    if (filters.sku && normalizeReportCode(item.sku) !== filters.sku) {
      return false;
    }

    return true;
  });
}

function scopedSalesRevenue(order: Pick<AdminOrderDetail, "total">, items: AdminOrderDetail["items"], filters: NormalizedAdminReportFilters) {
  if (!filters.hasProductFilter) {
    return order.total;
  }

  return sum(items.map((item) => item.lineTotal));
}

function buildScopedSalesOrders(orders: AdminOrderDetail[], from: string, to: string, filters: NormalizedAdminReportFilters) {
  return orders
    .filter((order) => isOrderCommerciallyReportable(order) && isInRange(order.confirmedAt, from, to) && matchesReportOrder(order, filters))
    .map((order) => {
      const matchedItems = filterReportItems(order, filters);
      if (!matchedItems.length) {
        return undefined;
      }

      return {
        order,
        confirmedAt: order.confirmedAt ?? order.createdAt,
        salesChannel: order.salesChannel,
        matchedItems,
        revenue: scopedSalesRevenue(order, matchedItems, filters)
      } satisfies ScopedSalesOrder;
    })
    .filter((entry): entry is ScopedSalesOrder => Boolean(entry))
    .sort((left, right) => right.confirmedAt.localeCompare(left.confirmedAt));
}

@Injectable()
export class CoreService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
    private readonly vendorsService: VendorsService,
    private readonly commissionsService: CommissionsService,
    private readonly wholesaleService: WholesaleService,
    private readonly marketingService: MarketingService,
    private readonly notificationsService: NotificationsService,
    private readonly loyaltyService: LoyaltyService
  ) {}

  async getOverviewForUser(user: AuthUserSummary) {
    const focus = resolveDashboardFocus(user);
    const orders = this.ordersService.listOrders().data;
    const payments = this.paymentsService.listPayments().data;
    const reviewQueue = this.paymentsService.listManualRequests().data;
    const vendors = this.vendorsService.listVendors().data;
    const commissions = this.commissionsService.listCommissions().data;
    const payouts = this.commissionsService.listPayouts().data;
    const wholesaleLeads = this.wholesaleService.listLeads().data;
    const campaigns = this.marketingService.listCampaigns().data;
    const loyaltyAccounts = this.loyaltyService.listAccounts().data;
    const notifications = (await this.notificationsService.listNotifications()).data;
    const commissionRows = buildCommissionRows(vendors, commissions);

    const overview = this.buildDashboardByFocus({
      focus,
      orders,
      payments,
      reviewQueue,
      vendors,
      commissions,
      payouts,
      wholesaleLeads,
      campaigns,
      notifications,
      loyaltyAccounts
    });

    return wrapResponse(overview, {
      generatedAt: new Date().toISOString(),
      focus,
      userId: user.id
    });
  }

  getSellerPanelOverview(user: AuthUserSummary) {
    const seller = this.vendorsService.resolveVendorSummaryForAuthUser(user);
    if (!seller) {
      throw new NotFoundException("La cuenta todavía no está vinculada a un vendedor activo de Huelegood.");
    }

    const recentOrders = this.ordersService.listOrdersByVendorCode(seller.code).data.slice(0, 6);
    const commissions = this.commissionsService.listCommissionsByVendorCode(seller.code).data.slice(0, 8);
    const payouts = this.commissionsService.listPayoutsByVendorCode(seller.code).data.slice(0, 6);

    const metrics: AdminMetric[] = [
      {
        label: "Ventas atribuidas",
        value: formatCurrency(seller.sales),
        detail: "Ventas consolidadas bajo tu código."
      },
      {
        label: "Pedidos atribuidos",
        value: String(seller.ordersCount),
        detail: "Pedidos con trazabilidad comercial confirmada."
      },
      {
        label: "Comisión pendiente",
        value: formatCurrency(seller.pendingCommissions),
        detail: "Monto todavía no liquidado."
      },
      {
        label: "Comisión pagada",
        value: formatCurrency(seller.paidCommissions),
        detail: "Liquidaciones ya conciliadas."
      }
    ];

    const summary: SellerPanelOverviewSummary = {
      seller,
      metrics,
      recentOrders,
      commissions,
      payouts
    };

    return wrapResponse(summary, {
      generatedAt: new Date().toISOString(),
      vendorCode: seller.code
    });
  }

  getReportByPeriod(from: string, to: string, rawFilters: AdminReportFiltersInput = {}) {
    const filters = normalizeReportFilters(rawFilters);
    const allOrders = this.ordersService.getAllOrderDetails();
    const orderSummaries = new Map(this.ordersService.listOrders().data.map((order) => [order.orderNumber, order]));
    const operationalOrders = allOrders
      .filter(
        (order) =>
          isInRange(order.createdAt, from, to) &&
          matchesReportOrder(order, filters) &&
          filterReportItems(order, filters).length > 0
      )
      .map((order) => orderSummaries.get(order.orderNumber))
      .filter((order): order is NonNullable<typeof order> => Boolean(order));
    const salesOrders = buildScopedSalesOrders(allOrders, from, to, filters);
    const commissions = this.commissionsService.listCommissions().data;
    const payouts = this.commissionsService.listPayouts().data;

    const revenue = sum(salesOrders.map((entry) => entry.revenue));

    const byDayMap: Record<string, { count: number; revenue: number; paid: number }> = {};
    for (const entry of salesOrders) {
      const day = entry.confirmedAt.slice(0, 10);
      if (!byDayMap[day]) {
        byDayMap[day] = { count: 0, revenue: 0, paid: 0 };
      }
      byDayMap[day].count += 1;
      byDayMap[day].revenue += entry.revenue;
      byDayMap[day].paid += 1;
    }

    const byDay = Object.entries(byDayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({ date, ...stats }));

    const byPaymentMethod: Record<string, number> = {};
    for (const entry of salesOrders) {
      const method = entry.order.paymentMethod ?? "unknown";
      byPaymentMethod[method] = (byPaymentMethod[method] ?? 0) + 1;
    }

    const byStatus: Record<string, number> = {};
    for (const order of operationalOrders) {
      byStatus[order.orderStatus] = (byStatus[order.orderStatus] ?? 0) + 1;
    }

    const byChannel: Record<string, number> = {};
    const detailRows: SalesDetailReportRow[] = [];
    const vendorMap = new Map<string, VendorSalesReportRow>();
    const productMap = new Map<string, ProductSalesReportRow>();

    for (const entry of salesOrders) {
      const { order, confirmedAt, salesChannel, matchedItems, revenue: orderRevenue } = entry;
      byChannel[salesChannel] = (byChannel[salesChannel] ?? 0) + 1;

      const vendorKey = order.vendorId ?? order.vendorCode ?? "sin-vendedor";
      const vendorName = order.vendorName ?? order.vendorCode ?? "Sin vendedor";
      const vendorRow = vendorMap.get(vendorKey) ?? {
        vendorId: order.vendorId,
        vendorCode: order.vendorCode,
        vendorName,
        salesCount: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        lastSaleAt: undefined,
        webSalesCount: 0,
        manualSalesCount: 0
      };

      vendorRow.salesCount += 1;
      vendorRow.totalRevenue += orderRevenue;
      vendorRow.avgOrderValue = Math.round(vendorRow.totalRevenue / vendorRow.salesCount);
      vendorRow.lastSaleAt =
        !vendorRow.lastSaleAt || confirmedAt > vendorRow.lastSaleAt ? confirmedAt : vendorRow.lastSaleAt;
      if (salesChannel === "web") {
        vendorRow.webSalesCount += 1;
      } else {
        vendorRow.manualSalesCount += 1;
      }
      vendorMap.set(vendorKey, vendorRow);

      for (const item of matchedItems) {
        const productKey = `${item.slug}::${item.sku}`;
        const productRow = productMap.get(productKey) ?? {
          productSlug: item.slug,
          productName: item.name,
          sku: item.sku,
          unitsSold: 0,
          totalRevenue: 0,
          lastSoldAt: undefined,
          webUnitsSold: 0,
          manualUnitsSold: 0
        };

        productRow.unitsSold += item.quantity;
        productRow.totalRevenue += item.lineTotal;
        productRow.lastSoldAt =
          !productRow.lastSoldAt || confirmedAt > productRow.lastSoldAt ? confirmedAt : productRow.lastSoldAt;
        if (salesChannel === "web") {
          productRow.webUnitsSold += item.quantity;
        } else {
          productRow.manualUnitsSold += item.quantity;
        }
        productMap.set(productKey, productRow);

        detailRows.push({
          orderNumber: order.orderNumber,
          confirmedAt,
          salesChannel,
          vendorId: order.vendorId,
          vendorCode: order.vendorCode,
          vendorName: order.vendorName,
          productSlug: item.slug,
          productName: item.name,
          sku: item.sku,
          quantity: item.quantity,
          lineTotal: item.lineTotal
        });
      }
    }

    const vendorRows = Array.from(vendorMap.values()).sort((left, right) => {
      if (right.totalRevenue !== left.totalRevenue) {
        return right.totalRevenue - left.totalRevenue;
      }

      return left.vendorName.localeCompare(right.vendorName);
    });

    const productRows = Array.from(productMap.values()).sort((left, right) => {
      if (right.unitsSold !== left.unitsSold) {
        return right.unitsSold - left.unitsSold;
      }

      return left.productName.localeCompare(right.productName);
    });

    detailRows.sort((left, right) => right.confirmedAt.localeCompare(left.confirmedAt));

    const payableComm = commissions.filter((c) =>
      [CommissionStatus.Payable, CommissionStatus.ScheduledForPayout].includes(c.status)
    );
    const paidComm = commissions.filter((c) => c.status === CommissionStatus.Paid);
    const paidPayouts = payouts.filter((p) => p.status === CommissionPayoutStatus.Paid);
    const appliedFilters = {
      salesChannel: filters.salesChannel,
      vendorCode: filters.vendorCode,
      productSlug: filters.productSlug,
      sku: filters.sku
    };

    return wrapResponse(
      {
        period: { from, to },
        orders: {
          total: operationalOrders.length,
          revenue,
          paidRevenue: revenue,
          paid: salesOrders.length,
          pending: operationalOrders.filter((o) => o.orderStatus === OrderStatus.PendingPayment).length,
          cancelled: operationalOrders.filter((o) => o.orderStatus === OrderStatus.Cancelled).length,
          conversionRate: operationalOrders.length > 0 ? Math.round((salesOrders.length / operationalOrders.length) * 100) : 0,
          avgOrderValue: salesOrders.length > 0 ? Math.round(revenue / salesOrders.length) : 0,
          byPaymentMethod,
          byStatus,
          byDay,
          recent: operationalOrders.slice(0, 10)
        },
        sales: {
          totalConfirmed: salesOrders.length,
          totalRevenue: revenue,
          byChannel,
          details: detailRows.slice(0, 50)
        },
        vendors: {
          rows: vendorRows
        },
        products: {
          rows: productRows
        },
        commissions: {
          total: commissions.length,
          totalAmount: sum(commissions.map((c) => c.commissionAmount)),
          payable: payableComm.length,
          payableAmount: sum(payableComm.map((c) => c.commissionAmount)),
          paid: paidComm.length,
          paidAmount: sum(paidPayouts.map((p) => p.netAmount))
        }
      },
      { generatedAt: new Date().toISOString(), filters: appliedFilters }
    );
  }

  generateOrdersCsv(from: string, to: string, rawFilters: AdminReportFiltersInput = {}): string {
    const filters = normalizeReportFilters(rawFilters);
    const orders = buildScopedSalesOrders(this.ordersService.getAllOrderDetails(), from, to, filters);
    const escape = (v: string | number | undefined | null) => {
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Pedido", "Cliente", "Canal", "Total", "Metodo", "Estado pedido", "Estado pago", "Vendedor", "Codigo", "Items", "Fecha venta"].join(",");
    const rows = orders.map(({ order, confirmedAt, matchedItems, revenue }) =>
      [
        escape(order.orderNumber),
        escape(fullCustomerName(order.customer) || order.customer.email),
        escape(order.salesChannel),
        escape(revenue),
        escape(order.paymentMethod),
        escape(order.orderStatus),
        escape(order.paymentStatus),
        escape(order.vendorName),
        escape(order.vendorCode),
        escape(matchedItems.length),
        escape(confirmedAt.slice(0, 10))
      ].join(",")
    );
    return [header, ...rows].join("\n");
  }

  private buildDashboardByFocus(input: {
    focus: AdminRoleDashboardSummary["focus"];
    orders: ReturnType<OrdersService["listOrders"]>["data"];
    payments: ReturnType<PaymentsService["listPayments"]>["data"];
    reviewQueue: ReturnType<PaymentsService["listManualRequests"]>["data"];
    vendors: ReturnType<VendorsService["listVendors"]>["data"];
    commissions: ReturnType<CommissionsService["listCommissions"]>["data"];
    payouts: ReturnType<CommissionsService["listPayouts"]>["data"];
    wholesaleLeads: ReturnType<WholesaleService["listLeads"]>["data"];
    campaigns: ReturnType<MarketingService["listCampaigns"]>["data"];
    notifications: Awaited<ReturnType<NotificationsService["listNotifications"]>>["data"];
    loyaltyAccounts: ReturnType<LoyaltyService["listAccounts"]>["data"];
  }): AdminRoleDashboardSummary {
    const { focus, orders, payments, reviewQueue, vendors, commissions, payouts, wholesaleLeads, campaigns, notifications, loyaltyAccounts } =
      input;
    const vendorOrders = orders.filter((order) => order.vendorCode);
    const openLeads = wholesaleLeads.filter((lead) =>
      [
        WholesaleLeadStatus.New,
        WholesaleLeadStatus.Qualified,
        WholesaleLeadStatus.Quoted,
        WholesaleLeadStatus.Negotiating
      ].includes(lead.status)
    );
    const inFlightCampaigns = campaigns.filter((campaign) =>
      [CampaignStatus.Running, CampaignStatus.Scheduled].includes(campaign.status)
    );
    const pendingNotifications = notifications.filter((notification) => notification.status === NotificationStatus.Pending);
    const activeVendors = vendors.filter((vendor) => vendor.status === "active");
    const payableCommissions = commissions.filter((commission) =>
      [CommissionStatus.Payable, CommissionStatus.ScheduledForPayout].includes(commission.status)
    );
    const paidPayouts = payouts.filter((payout) => payout.status === CommissionPayoutStatus.Paid);
    const commissionRows = buildCommissionRows(vendors, commissions);

    switch (focus) {
      case "payments":
        return {
          focus,
          title: "Dashboard de pagos",
          description: "Conciliación, revisión manual y salud del cobro operativo.",
          metrics: [
            {
              label: "Pagos confirmados",
              value: String(payments.filter((payment) => payment.status === PaymentStatus.Paid).length),
              detail: "Cobros ya conciliados."
            },
            {
              label: "Revisión manual",
              value: String(reviewQueue.filter((request) => request.status === "under_review").length),
              detail: "Comprobantes pendientes de resolución."
            },
            {
              label: "Cobros pendientes",
              value: String(
                payments.filter((payment) => [PaymentStatus.Initiated, PaymentStatus.Pending].includes(payment.status)).length
              ),
              detail: "Openpay o pago manual todavía no cerrados."
            },
            {
              label: "Pagos fallidos",
              value: String(payments.filter((payment) => payment.status === PaymentStatus.Failed).length),
              detail: "Casos que requieren seguimiento o reintento."
            }
          ],
          recentOrders: orders.filter((order) => order.paymentMethod === "manual" || order.paymentStatus !== PaymentStatus.Paid).slice(0, 6),
          paymentRows: payments.slice(0, 8),
          reviewQueue: reviewQueue.slice(0, 6),
          commissionRows: [],
          payouts: [],
          vendorRows: [],
          wholesaleLeads: [],
          campaigns: [],
          notifications: pendingNotifications.slice(0, 4),
          loyaltyAccounts: []
        };
      case "marketing":
        return {
          focus,
          title: "Dashboard comercial y CRM",
          description: "Campañas activas, leads mayoristas, notificaciones y fidelización en curso.",
          metrics: [
            {
              label: "Campañas activas",
              value: String(inFlightCampaigns.length),
              detail: "Campañas en scheduled o running."
            },
            {
              label: "Leads abiertos",
              value: String(openLeads.length),
              detail: "Mayoristas todavía en seguimiento."
            },
            {
              label: "Notificaciones pendientes",
              value: String(pendingNotifications.length),
              detail: "Cola comercial pendiente de despacho."
            },
            {
              label: "Cuentas loyalty activas",
              value: String(loyaltyAccounts.filter((account) => account.availablePoints > 0).length),
              detail: "Clientes con puntos disponibles."
            }
          ],
          recentOrders: [],
          paymentRows: [],
          reviewQueue: [],
          commissionRows: [],
          payouts: [],
          vendorRows: [],
          wholesaleLeads: wholesaleLeads.slice(0, 6),
          campaigns: campaigns.slice(0, 6),
          notifications: notifications.slice(0, 6),
          loyaltyAccounts: loyaltyAccounts.slice(0, 6)
        };
      case "sales":
        return {
          focus,
          title: "Dashboard de ventas y sellers",
          description: "Visibilidad de vendedores, ventas atribuidas, comisiones y liquidaciones.",
          metrics: [
            {
              label: "Vendedores activos",
              value: String(activeVendors.length),
              detail: "Códigos comerciales habilitados."
            },
            {
              label: "Ventas atribuidas",
              value: formatCurrency(sum(vendorOrders.map((order) => order.total))),
              detail: "Pedidos con código comercial aplicado."
            },
            {
              label: "Comisión por liquidar",
              value: formatCurrency(sum(payableCommissions.map((commission) => commission.commissionAmount))),
              detail: "Comisiones payables o programadas."
            },
            {
              label: "Liquidado",
              value: formatCurrency(sum(paidPayouts.map((payout) => payout.netAmount))),
              detail: "Monto ya conciliado a vendedores."
            }
          ],
          recentOrders: vendorOrders.slice(0, 6),
          paymentRows: [],
          reviewQueue: [],
          commissionRows: commissionRows.slice(0, 6),
          payouts: payouts.slice(0, 6),
          vendorRows: vendors.slice(0, 6),
          wholesaleLeads: openLeads.slice(0, 4),
          campaigns: [],
          notifications: [],
          loyaltyAccounts: []
        };
      case "executive":
      default:
        return {
          focus: "executive",
          title: "Dashboard ejecutivo",
          description: "Resumen transversal de operación, pagos, sellers y frentes comerciales.",
          metrics: [
            {
              label: "Pedidos activos",
              value: String(orders.length),
              detail: "Pedidos visibles en operación."
            },
            {
              label: "Ventas brutas",
              value: formatCurrency(sum(orders.map((order) => order.total))),
              detail: "Total agregado desde órdenes reales."
            },
            {
              label: "Pagos confirmados",
              value: String(payments.filter((payment) => payment.status === PaymentStatus.Paid).length),
              detail: "Cobros conciliados desde el API."
            },
            {
              label: "Vendedores activos",
              value: String(activeVendors.length),
              detail: "Códigos habilitados para atribución."
            }
          ],
          recentOrders: orders.slice(0, 6),
          paymentRows: payments.slice(0, 6),
          reviewQueue: reviewQueue.slice(0, 4),
          commissionRows: commissionRows.slice(0, 6),
          payouts: payouts.slice(0, 4),
          vendorRows: vendors.slice(0, 4),
          wholesaleLeads: openLeads.slice(0, 4),
          campaigns: inFlightCampaigns.slice(0, 4),
          notifications: pendingNotifications.slice(0, 4),
          loyaltyAccounts: loyaltyAccounts.slice(0, 4)
        };
    }
  }
}
