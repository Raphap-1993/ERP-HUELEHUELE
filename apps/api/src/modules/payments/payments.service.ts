import { Injectable } from "@nestjs/common";
import { type ManualReviewActionInput } from "@huelegood/shared";
import { OrdersService } from "../orders/orders.service";

@Injectable()
export class PaymentsService {
  constructor(private readonly ordersService: OrdersService) {}

  listPayments() {
    return this.ordersService.listPayments();
  }

  listManualRequests() {
    return this.ordersService.listManualPaymentRequests();
  }

  approveManualRequest(id: string, body: ManualReviewActionInput) {
    return this.ordersService.approveManualRequest(id, body.reviewer, body.notes);
  }

  rejectManualRequest(id: string, body: ManualReviewActionInput) {
    return this.ordersService.rejectManualRequest(id, body.reviewer, body.notes);
  }
}
