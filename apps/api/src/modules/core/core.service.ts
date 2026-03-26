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
  type AdminMetric,
  type AdminRoleDashboardSummary,
  type AuthUserSummary,
  type CommissionRow,
  type CommissionSummary,
  type SellerPanelOverviewSummary,
  type VendorSummary
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

  getReportByPeriod(from: string, to: string) {
    const orders = this.ordersService.listOrdersInRange(from, to).data;
    const commissions = this.commissionsService.listCommissions().data;
    const payouts = this.commissionsService.listPayouts().data;

    const paidOrders = orders.filter((o) => o.paymentStatus === PaymentStatus.Paid);
    const revenue = sum(orders.map((o) => o.total));
    const paidRevenue = sum(paidOrders.map((o) => o.total));

    // Daily breakdown
    const byDayMap: Record<string, { count: number; revenue: number; paid: number }> = {};
    for (const order of orders) {
      const day = order.createdAt.slice(0, 10);
      if (!byDayMap[day]) {
        byDayMap[day] = { count: 0, revenue: 0, paid: 0 };
      }
      byDayMap[day].count++;
      byDayMap[day].revenue += order.total;
      if (order.paymentStatus === PaymentStatus.Paid) {
        byDayMap[day].paid++;
      }
    }
    const byDay = Object.entries(byDayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({ date, ...stats }));

    // Payment method breakdown
    const byPaymentMethod: Record<string, number> = {};
    for (const order of orders) {
      const method = order.paymentMethod ?? "unknown";
      byPaymentMethod[method] = (byPaymentMethod[method] ?? 0) + 1;
    }

    // Order status breakdown
    const byStatus: Record<string, number> = {};
    for (const order of orders) {
      byStatus[order.orderStatus] = (byStatus[order.orderStatus] ?? 0) + 1;
    }

    // Commission aggregates (current totals, no date filter available on CommissionSummary)
    const payableComm = commissions.filter((c) =>
      [CommissionStatus.Payable, CommissionStatus.ScheduledForPayout].includes(c.status)
    );
    const paidComm = commissions.filter((c) => c.status === CommissionStatus.Paid);
    const paidPayouts = payouts.filter((p) => p.status === CommissionPayoutStatus.Paid);

    return wrapResponse(
      {
        period: { from, to },
        orders: {
          total: orders.length,
          revenue,
          paidRevenue,
          paid: paidOrders.length,
          pending: orders.filter((o) => o.orderStatus === OrderStatus.PendingPayment).length,
          cancelled: orders.filter((o) => o.orderStatus === OrderStatus.Cancelled).length,
          conversionRate: orders.length > 0 ? Math.round((paidOrders.length / orders.length) * 100) : 0,
          avgOrderValue: orders.length > 0 ? Math.round(revenue / orders.length) : 0,
          byPaymentMethod,
          byStatus,
          byDay,
          recent: orders.slice(0, 10)
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
      { generatedAt: new Date().toISOString() }
    );
  }

  generateOrdersCsv(from: string, to: string): string {
    const orders = this.ordersService.listOrdersInRange(from, to).data;
    const escape = (v: string | number | undefined | null) => {
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Pedido", "Cliente", "Total", "Método", "Estado pedido", "Estado pago", "Vendedor", "Items", "Fecha"].join(",");
    const rows = orders.map((o) =>
      [
        escape(o.orderNumber),
        escape(o.customerName),
        escape(o.total),
        escape(o.paymentMethod),
        escape(o.orderStatus),
        escape(o.paymentStatus),
        escape(o.vendorCode),
        escape(o.itemCount),
        escape(o.createdAt.slice(0, 10))
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
