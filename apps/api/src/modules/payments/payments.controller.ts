import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { PaymentsService, type ManualReviewActionInput } from "./payments.service";

@Controller("admin/payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
