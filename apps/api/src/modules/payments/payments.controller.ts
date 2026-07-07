import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { adminModulePermissions, type AdminManualPaymentCreateInput, type ManualReviewActionInput } from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { PaymentsService } from "./payments.service";

@RequirePermissions(...adminModulePermissions.payments.read)
@Controller("admin/payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  listPayments() {
    return this.paymentsService.listPayments();
  }

  @Get("manual-requests")
  listManualRequests() {
    return this.paymentsService.listManualRequests();
  }

  @Post(":orderNumber/register-manual")
  @RequirePermissions(...adminModulePermissions.payments.review!)
  registerManualPayment(@Param("orderNumber") orderNumber: string, @Body() body: AdminManualPaymentCreateInput) {
    return this.paymentsService.registerManualPayment(orderNumber, body);
  }

  @Post("manual-requests/:id/approve")
  @RequirePermissions(...adminModulePermissions.payments.review!)
  approve(@Param("id") id: string, @Body() body: ManualReviewActionInput) {
    return this.paymentsService.queueApproveManualRequest(id, body);
  }

  @Post("manual-requests/:id/reject")
  @RequirePermissions(...adminModulePermissions.payments.review!)
  reject(@Param("id") id: string, @Body() body: ManualReviewActionInput) {
    return this.paymentsService.queueRejectManualRequest(id, body);
  }
}
