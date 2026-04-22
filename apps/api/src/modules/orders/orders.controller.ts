import { Body, Controller, Delete, Get, Param, Post, Req } from "@nestjs/common";
import {
  adminAccessRoles,
  type AdminDispatchLabelPrintInput,
  type AdminManualPaymentCreateInput,
  type AdminOrderStatusTransitionInput,
  type AdminOrderVendorAssignmentInput,
  type AuthSessionSummary,
  type OrderFulfillmentAssignmentInput
} from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { OrdersService } from "./orders.service";

interface AuthenticatedRequest {
  authUser?: AuthSessionSummary["user"];
}

@RequireRoles(...adminAccessRoles.orders)
@Controller("admin/orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  listOrders() {
    return this.ordersService.listOrders();
  }

  @Get("vendor-options")
  listOrderVendorOptions() {
    return this.ordersService.listOrderVendorOptions();
  }

  @Post()
  createBackofficeOrder(
    @Body() body: {
      customer: { firstName: string; lastName: string; email: string; phone: string };
      address: {
        line1: string;
        line2?: string;
        city?: string;
        region?: string;
        countryCode?: string;
        departmentCode?: string;
        provinceCode?: string;
        districtCode?: string;
      };
      items: Array<{ slug: string; name: string; sku: string; variantId?: string; quantity: number; unitPrice: number }>;
      initialStatus: "paid" | "pending_payment";
      notes?: string;
      vendorCode?: string;
    }
  ) {
    return this.ordersService.createBackofficeOrder({ ...body, reviewer: "admin" });
  }

  @Get(":orderNumber")
  getOrder(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.getOrder(orderNumber);
  }

  @Get(":orderNumber/fulfillment")
  getOrderFulfillment(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.getOrderFulfillment(orderNumber);
  }

  @Post(":orderNumber/fulfillment/suggest")
  suggestOrderFulfillment(
    @Param("orderNumber") orderNumber: string,
    @Req() request: AuthenticatedRequest
  ) {
    return this.ordersService.suggestOrderFulfillment(orderNumber, request.authUser);
  }

  @Post(":orderNumber/fulfillment")
  assignOrderFulfillment(
    @Param("orderNumber") orderNumber: string,
    @Req() request: AuthenticatedRequest,
    @Body() body: OrderFulfillmentAssignmentInput
  ) {
    return this.ordersService.assignOrderFulfillment(orderNumber, body, request.authUser);
  }

  @Get(":orderNumber/dispatch-label")
  @RequireRoles(...adminAccessRoles.dispatch)
  getDispatchLabel(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.getDispatchLabel(orderNumber);
  }

  @Post(":orderNumber/dispatch-label/print")
  @RequireRoles(...adminAccessRoles.dispatch)
  recordDispatchLabelPrint(
    @Param("orderNumber") orderNumber: string,
    @Req() request: AuthenticatedRequest,
    @Body() body: AdminDispatchLabelPrintInput
  ) {
    return this.ordersService.recordDispatchLabelPrint(orderNumber, request.authUser, body);
  }

  @Post(":orderNumber/status")
  transitionOrderStatus(@Param("orderNumber") orderNumber: string, @Body() body: AdminOrderStatusTransitionInput) {
    return this.ordersService.transitionOrderStatus(orderNumber, body);
  }

  @Post(":orderNumber/vendor")
  updateOrderVendor(@Param("orderNumber") orderNumber: string, @Body() body: AdminOrderVendorAssignmentInput) {
    return this.ordersService.assignOrderVendor(orderNumber, body);
  }

  @Post(":orderNumber/manual-payment")
  registerManualPayment(@Param("orderNumber") orderNumber: string, @Body() body: AdminManualPaymentCreateInput) {
    return this.ordersService.registerAdminManualPayment(orderNumber, body);
  }

  @Post(":orderNumber/confirm-online-payment")
  confirmOnlinePayment(@Param("orderNumber") orderNumber: string, @Body() body: AdminManualPaymentCreateInput) {
    return this.ordersService.confirmOnlinePayment(orderNumber, body);
  }

  @Post(":orderNumber/resend-approval-email")
  resendApprovalEmail(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.resendManualApprovalNotification(orderNumber, "admin");
  }

  @Delete(":orderNumber")
  deleteOrder(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.deleteOrder(orderNumber);
  }
}
