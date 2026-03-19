import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { type ManualReviewActionInput } from "@huelegood/shared";
import { PaymentsService } from "./payments.service";

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

  @Post("manual-requests/:id/approve")
  approve(@Param("id") id: string, @Body() body: ManualReviewActionInput) {
    return this.paymentsService.approveManualRequest(id, body);
  }

  @Post("manual-requests/:id/reject")
  reject(@Param("id") id: string, @Body() body: ManualReviewActionInput) {
    return this.paymentsService.rejectManualRequest(id, body);
  }
}
