import { Body, Controller, Delete, Get, Param, Post, Req } from "@nestjs/common";
import {
  adminModulePermissions,
  type AdminBackofficeOrderBulkInput,
  type AdminBackofficeOrderInput,
  type AdminDispatchLabelPrintInput,
  type AdminManualPaymentCreateInput,
  type AdminOrderStatusTransitionInput,
  type AdminOrderVendorAssignmentInput,
  type AuthSessionSummary,
  type OrderFulfillmentAssignmentInput
} from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { OrdersService } from "./orders.service";

interface AuthenticatedRequest {
  authUser?: AuthSessionSummary["user"];
}

@RequirePermissions(...adminModulePermissions.orders.read)
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
  @RequirePermissions(...adminModulePermissions.orders.manage!)
  createBackofficeOrder(@Body() body: AdminBackofficeOrderInput) {
    return this.ordersService.createBackofficeOrder({ ...body, reviewer: "admin" });
  }

  @Post("bulk")
  @RequirePermissions(...adminModulePermissions.orders.manage!)
  createBackofficeOrdersBulk(@Body() body: AdminBackofficeOrderBulkInput) {
    return this.ordersService.createBackofficeOrdersBulk({
      ...body,
      reviewer: "admin",
      orders: Array.isArray(body.orders) ? body.orders : []
    });
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
  @RequirePermissions(...adminModulePermissions.orders.manage!)
  suggestOrderFulfillment(
    @Param("orderNumber") orderNumber: string,
    @Req() request: AuthenticatedRequest
  ) {
    return this.ordersService.suggestOrderFulfillment(orderNumber, request.authUser);
  }

  @Post(":orderNumber/fulfillment")
  @RequirePermissions(...adminModulePermissions.orders.manage!)
  assignOrderFulfillment(
    @Param("orderNumber") orderNumber: string,
    @Req() request: AuthenticatedRequest,
    @Body() body: OrderFulfillmentAssignmentInput
  ) {
    return this.ordersService.assignOrderFulfillment(orderNumber, body, request.authUser);
  }

  @Get(":orderNumber/dispatch-label")
  @RequirePermissions(...adminModulePermissions.dispatch.read)
  getDispatchLabel(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.getDispatchLabel(orderNumber);
  }

  @Post(":orderNumber/dispatch-label/print")
  @RequirePermissions(...adminModulePermissions.dispatch.manage!)
  recordDispatchLabelPrint(
    @Param("orderNumber") orderNumber: string,
    @Req() request: AuthenticatedRequest,
    @Body() body: AdminDispatchLabelPrintInput
  ) {
    return this.ordersService.recordDispatchLabelPrint(orderNumber, request.authUser, body);
  }

  @Post(":orderNumber/status")
  @RequirePermissions(...adminModulePermissions.orders.manage!)
  transitionOrderStatus(@Param("orderNumber") orderNumber: string, @Body() body: AdminOrderStatusTransitionInput) {
    return this.ordersService.transitionOrderStatus(orderNumber, body);
  }

  @Post(":orderNumber/vendor")
  @RequirePermissions(...adminModulePermissions.orders.manage!)
  updateOrderVendor(@Param("orderNumber") orderNumber: string, @Body() body: AdminOrderVendorAssignmentInput) {
    return this.ordersService.assignOrderVendor(orderNumber, body);
  }

  @Post(":orderNumber/manual-payment")
  @RequirePermissions(...adminModulePermissions.payments.review!)
  registerManualPayment(@Param("orderNumber") orderNumber: string, @Body() body: AdminManualPaymentCreateInput) {
    return this.ordersService.registerAdminManualPayment(orderNumber, body);
  }

  @Post(":orderNumber/confirm-online-payment")
  @RequirePermissions(...adminModulePermissions.payments.review!)
  confirmOnlinePayment(@Param("orderNumber") orderNumber: string, @Body() body: AdminManualPaymentCreateInput) {
    return this.ordersService.confirmOnlinePayment(orderNumber, body);
  }

  @Post(":orderNumber/resend-approval-email")
  @RequirePermissions(...adminModulePermissions.orders.manage!)
  resendApprovalEmail(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.resendManualApprovalNotification(orderNumber, "admin");
  }

  @Delete(":orderNumber")
  @RequirePermissions(...adminModulePermissions.orders.manage!)
  deleteOrder(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.deleteOrder(orderNumber);
  }
}
