import { Injectable, NotFoundException } from "@nestjs/common";
import { type ManualReviewActionInput } from "@huelegood/shared";
import { actionResponse } from "../../common/response";
import { BullMqService } from "../../persistence/bullmq.service";
import { CommissionsService } from "../commissions/commissions.service";
import { OrdersService } from "../orders/orders.service";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly commissionsService: CommissionsService,
    private readonly bullMqService: BullMqService
  ) {}

  listPayments() {
    return this.ordersService.listPayments();
  }

  listManualRequests() {
    return this.ordersService.listManualPaymentRequests();
  }

  async queueApproveManualRequest(id: string, body: ManualReviewActionInput) {
    this.ensureManualRequestExists(id);
    const job = await this.bullMqService.enqueueManualPaymentReview({
      manualRequestId: id,
      decision: "approve",
      reviewer: body.reviewer,
      notes: body.notes,
      requestedAt: new Date().toISOString()
    });

    if (job) {
      return actionResponse("queued", "La conciliación manual quedó en cola para revisión operativa.", id);
    }

    return this.approveManualRequest(id, body);
  }

  async queueRejectManualRequest(id: string, body: ManualReviewActionInput) {
    this.ensureManualRequestExists(id);
    const job = await this.bullMqService.enqueueManualPaymentReview({
      manualRequestId: id,
      decision: "reject",
      reviewer: body.reviewer,
      notes: body.notes,
      requestedAt: new Date().toISOString()
    });

    if (job) {
      return actionResponse("queued", "La resolución manual quedó en cola para rechazo operativo.", id);
    }

    return this.rejectManualRequest(id, body);
  }

  async approveManualRequest(id: string, body: ManualReviewActionInput) {
    const result = await this.ordersService.approveManualRequest(id, body.reviewer, body.notes);
    this.commissionsService.syncFromOrders("manual_review_approved");
    return result;
  }

  async rejectManualRequest(id: string, body: ManualReviewActionInput) {
    const result = await this.ordersService.rejectManualRequest(id, body.reviewer, body.notes);
    this.commissionsService.syncFromOrders("manual_review_rejected");
    return result;
  }

  private ensureManualRequestExists(id: string) {
    const request = this.ordersService
      .listManualPaymentRequests()
      .data.find((item) => item.id === id.trim());

    if (!request) {
      throw new NotFoundException(`No encontramos una solicitud manual con id ${id}.`);
    }

    return request;
  }
}
