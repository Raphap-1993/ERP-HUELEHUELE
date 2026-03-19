import { Injectable } from "@nestjs/common";
import { paymentReviews, type PaymentReviewSummary } from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";

export interface ManualReviewActionInput {
  reviewer?: string;
  notes?: string;
}

@Injectable()
export class PaymentsService {
  listManualRequests() {
    return wrapResponse<PaymentReviewSummary[]>(paymentReviews);
  }

  approveManualRequest(id: string, body: ManualReviewActionInput) {
    return {
      ...actionResponse("ok", "La solicitud fue aprobada operativamente y pasará al siguiente estado.", id),
      reviewer: body.reviewer ?? "operador"
    };
  }

  rejectManualRequest(id: string, body: ManualReviewActionInput) {
    return {
      ...actionResponse("rejected", "La solicitud fue rechazada y queda registrada para auditoría.", id),
      reviewer: body.reviewer ?? "operador"
    };
  }
}
