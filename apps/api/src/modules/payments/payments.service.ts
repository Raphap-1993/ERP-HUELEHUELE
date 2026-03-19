import { Injectable } from "@nestjs/common";
import { type ManualReviewActionInput } from "@huelegood/shared";
import { CommissionsService } from "../commissions/commissions.service";
import { OrdersService } from "../orders/orders.service";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly commissionsService: CommissionsService
  ) {}

  listPayments() {
    return this.ordersService.listPayments();
  }

  listManualRequests() {
    return this.ordersService.listManualPaymentRequests();
  }

  approveManualRequest(id: string, body: ManualReviewActionInput) {
    const result = this.ordersService.approveManualRequest(id, body.reviewer, body.notes);
    this.commissionsService.syncFromOrders("manual_review_approved");
    return result;
  }

  rejectManualRequest(id: string, body: ManualReviewActionInput) {
    const result = this.ordersService.rejectManualRequest(id, body.reviewer, body.notes);
    this.commissionsService.syncFromOrders("manual_review_rejected");
    return result;
  }
}
